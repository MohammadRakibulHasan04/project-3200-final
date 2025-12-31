import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { Platform, StyleSheet, View } from "react-native";

const TabIcon = ({
  icon,
  color,
  focused,
}: {
  icon: any;
  color: string;
  focused: boolean;
}) => {
  return (
    <View style={styles.tabIconContainer}>
      <View style={[styles.iconWrapper, focused && styles.iconWrapperFocused]}>
        <Ionicons name={icon} size={focused ? 28 : 24} color={color} />
      </View>
    </View>
  );
};

const TabsLayout = () => {
  return (
    <>
      <Tabs
        screenOptions={{
          tabBarShowLabel: false,
          tabBarHideOnKeyboard: true,
          tabBarActiveTintColor: "#FF8E01",
          tabBarInactiveTintColor: "#9CA3AF",
          tabBarStyle: styles.tabBar,
          tabBarBackground: () =>
            Platform.OS === "ios" ? (
              <BlurView
                intensity={80}
                tint="dark"
                style={StyleSheet.absoluteFill}
              />
            ) : null,
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon={focused ? "home" : "home-outline"}
                color={color}
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="courses"
          options={{
            title: "Courses",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon={focused ? "library" : "library-outline"}
                color={color}
                focused={focused}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="roadmap"
          options={{
            title: "Roadmap",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon={focused ? "map" : "map-outline"}
                color={color}
                focused={focused}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="discussion"
          options={{
            title: "Discussion",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon={focused ? "chatbubbles" : "chatbubbles-outline"}
                color={color}
                focused={focused}
              />
            ),
          }}
        />
      </Tabs>
    </>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor:
      Platform.OS === "ios" ? "rgba(22, 22, 34, 0.8)" : "#161622",
    borderTopWidth: 1,
    borderTopColor: "#232533",
    height: Platform.OS === "ios" ? 70 : 65,
    paddingBottom: Platform.OS === "ios" ? 12 : 8,
    paddingTop: Platform.OS === "ios" ? 12 : 8,
    elevation: 0,
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
  },
  tabIconContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  iconWrapper: {
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  iconWrapperFocused: {
    backgroundColor: "rgba(255, 142, 1, 0.15)",
  },
});

export default TabsLayout;
