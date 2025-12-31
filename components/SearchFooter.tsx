import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    ActivityIndicator,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface SearchFooterProps {
  query: string;
  setQuery: (query: string) => void;
  onSearch: () => void;
  isRefreshing: boolean;
}

const SearchFooter = ({
  query,
  setQuery,
  onSearch,
  isRefreshing,
}: SearchFooterProps) => {
  return (
    <View style={{ paddingHorizontal: 20, paddingVertical: 30 }}>
      <Text
        style={{
          color: "#CDCDE0",
          fontSize: 14,
          marginBottom: 12,
          textAlign: "center",
        }}
      >
        Looking for something specific?
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }}
      >
        <View
          style={{
            flex: 1,
            height: 50,
            backgroundColor: "#1E1E2D",
            borderRadius: 12,
            borderWidth: 2,
            borderColor: "#232533",
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 14,
          }}
        >
          <Ionicons
            name="search-outline"
            size={20}
            color="#CDCDE0"
            style={{ marginRight: 8 }}
          />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="e.g., advanced React hooks"
            placeholderTextColor="#7B7B8B"
            style={{
              flex: 1,
              color: "white",
              fontSize: 15,
            }}
            onSubmitEditing={onSearch}
            editable={!isRefreshing}
            returnKeyType="search"
          />
        </View>
        <TouchableOpacity
          onPress={onSearch}
          disabled={isRefreshing || !query.trim()}
          style={{
            height: 50,
            width: 50,
            backgroundColor: query.trim() ? "#FF8E01" : "#2D2D3A",
            borderRadius: 12,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {isRefreshing ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons
              name="arrow-forward"
              size={24}
              color={query.trim() ? "white" : "#7B7B8B"}
            />
          )}
        </TouchableOpacity>
      </View>
      <Text
        style={{
          color: "#7B7B8B",
          fontSize: 12,
          marginTop: 10,
          textAlign: "center",
          fontStyle: "italic",
        }}
      >
        Your preferences will be maintained - only relevant educational content
      </Text>
    </View>
  );
};

export default SearchFooter;
