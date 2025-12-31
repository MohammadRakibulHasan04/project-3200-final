import { useGlobalContext } from "@/context/GlobalProvider";
import { appwriteConfig, databases } from "@/lib/appwrite";
import { chatWithLearnTubeAI } from "@/lib/perplexity";
import { Ionicons } from "@expo/vector-icons";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { Query } from "react-native-appwrite";
import { SafeAreaView } from "react-native-safe-area-context";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// Memoized Message Component for better performance
const MessageItem = memo(({ item }: { item: Message }) => {
  const isUser = item.role === "user";

  return (
    <View
      style={[
        styles.messageContainer,
        isUser ? styles.userMessage : styles.aiMessage,
      ]}
    >
      {!isUser && (
        <View style={styles.aiIcon}>
          <Ionicons name="sparkles" size={16} color="#fff" />
        </View>
      )}
      <View
        style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.aiBubble,
        ]}
      >
        <Text style={styles.messageText}>{item.content}</Text>
        <Text style={styles.timestamp}>
          {item.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
      {isUser && (
        <View style={styles.userIcon}>
          <Ionicons name="person" size={16} color="#fff" />
        </View>
      )}
    </View>
  );
});

export default function Discussion() {
  const { user } = useGlobalContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userContext, setUserContext] = useState<any>(null);
  const [contextLoaded, setContextLoaded] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Load user context (preferences, selected categories, etc.)
  useEffect(() => {
    loadUserContext();
  }, [user]);

  const loadUserContext = async () => {
    if (!user?.$id) return;

    try {
      // Fetch user preferences
      const preferences = await databases.listDocuments(
        appwriteConfig.databaseId!,
        appwriteConfig.userPreferencesCollectionId!,
        [Query.equal("userId", user.$id)]
      );

      if (preferences.documents.length > 0) {
        const userPrefs = preferences.documents[0];
        setUserContext({
          name: user.name,
          selectedCategories: userPrefs.selectedCategories || [],
          keywords: userPrefs.keywords || [],
        });

        // Add welcome message
        const welcomeMessage: Message = {
          id: "welcome",
          role: "assistant",
          content: `Hello ${
            user.name
          }! 👋 I'm LearnTube AI, your personalized learning assistant. I can help you with:\n\n• Planning your learning journey in ${userPrefs.selectedCategories
            .slice(0, 2)
            .join(", ")}${
            userPrefs.selectedCategories.length > 2 ? " and more" : ""
          }\n• Answering questions about your fields of interest\n• Clarifying doubts about concepts\n• Providing study recommendations\n\nFeel free to ask me anything related to your learning goals!`,
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
      }
      setContextLoaded(true);
    } catch (error) {
      console.error("[Discussion] Error loading context:", error);
      setContextLoaded(true);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    if (!contextLoaded || !userContext) {
      Alert.alert("Please wait", "Loading your profile...");
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      // Send to Perplexity with user context
      const response = await chatWithLearnTubeAI(
        inputText.trim(),
        userContext,
        messages.filter((msg) => msg.id !== "welcome") // Exclude welcome message from history
      );

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      console.error("[Discussion] Chat error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I apologize, but I'm having trouble responding right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Memoized render function
  const renderMessage = useCallback(
    ({ item }: { item: Message }) => <MessageItem item={item} />,
    []
  );

  // Memoized key extractor
  const keyExtractor = useCallback((item: Message) => item.id, []);

  if (!contextLoaded) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={["top", "left", "right", "bottom"]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading your profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "left", "right", "bottom"]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="sparkles" size={24} color="#3b82f6" />
          </View>
          <View>
            <Text style={styles.headerTitle}>LearnTube AI</Text>
            <Text style={styles.headerSubtitle}>Your Learning Assistant</Text>
          </View>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={10}
          windowSize={10}
        />

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ask me about your learning..."
            placeholderTextColor="#6b7280"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f10",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#9ca3af",
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1f1f23",
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1e293b",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  headerSubtitle: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: 2,
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-end",
  },
  userMessage: {
    justifyContent: "flex-end",
  },
  aiMessage: {
    justifyContent: "flex-start",
  },
  aiIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  userIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#10b981",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  messageBubble: {
    maxWidth: "75%",
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: "#10b981",
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: "#1e293b",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    color: "#fff",
    fontSize: 15,
    lineHeight: 20,
  },
  timestamp: {
    color: "#9ca3af",
    fontSize: 10,
    marginTop: 4,
    textAlign: "right",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#1f1f23",
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: "#fff",
    fontSize: 15,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#374151",
  },
});
