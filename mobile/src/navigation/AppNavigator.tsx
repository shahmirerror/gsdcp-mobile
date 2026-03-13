import { useRef, useCallback, useState } from "react";
import { Image, View, StyleSheet } from "react-native";
import { NavigationContainer, NavigationState } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../lib/theme";
import { SplashTransition } from "../components/SplashTransition";

import DashboardScreen from "../screens/DashboardScreen";
import DogSearchScreen from "../screens/DogSearchScreen";
import DogProfileScreen from "../screens/DogProfileScreen";
import BreederDirectoryScreen from "../screens/BreederDirectoryScreen";
import ShowsScreen from "../screens/ShowsScreen";
import ProfileScreen from "../screens/ProfileScreen";

const logoSquare = require("../../assets/logo-square.png");

export type DogsStackParamList = {
  DogSearch: undefined;
  DogProfile: { id: string; name?: string };
};

export type RootTabParamList = {
  HomeTab: undefined;
  DogsTab: undefined;
  BreedersTab: undefined;
  ShowsTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const DogsStack = createNativeStackNavigator<DogsStackParamList>();

function DogsStackNavigator() {
  return (
    <DogsStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <DogsStack.Screen name="DogSearch" component={DogSearchScreen} />
      <DogsStack.Screen
        name="DogProfile"
        component={DogProfileScreen}
        options={{ headerShown: false }}
      />
    </DogsStack.Navigator>
  );
}

function getActiveRouteName(state: NavigationState | undefined): string {
  if (!state) return "";
  const route = state.routes[state.index];
  if (route.state) return getActiveRouteName(route.state as NavigationState);
  return route.name;
}

export default function AppNavigator() {
  const [transitioning, setTransitioning] = useState(false);
  const prevRoute = useRef<string>("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleStateChange = useCallback((state: NavigationState | undefined) => {
    const current = getActiveRouteName(state);
    if (prevRoute.current && current !== prevRoute.current) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setTransitioning(true);
      timerRef.current = setTimeout(() => {
        setTransitioning(false);
      }, 400);
    }
    prevRoute.current = current;
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer onStateChange={handleStateChange}>
        <Tab.Navigator
          initialRouteName="HomeTab"
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              if (route.name === "HomeTab") {
                return (
                  <Image
                    source={logoSquare}
                    style={{
                      width: size + 4,
                      height: size + 4,
                      opacity: focused ? 1 : 0.5,
                    }}
                    resizeMode="contain"
                  />
                );
              }
              let iconName: keyof typeof Ionicons.glyphMap = "home";
              if (route.name === "DogsTab") iconName = focused ? "paw" : "paw-outline";
              else if (route.name === "BreedersTab") iconName = focused ? "people" : "people-outline";
              else if (route.name === "ShowsTab") iconName = focused ? "trophy" : "trophy-outline";
              else if (route.name === "ProfileTab") iconName = focused ? "person" : "person-outline";
              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: COLORS.primary,
            tabBarInactiveTintColor: COLORS.textMuted,
            tabBarStyle: {
              backgroundColor: COLORS.surface,
              borderTopColor: COLORS.border,
              paddingBottom: 4,
              height: 60,
            },
            tabBarLabelStyle: { fontSize: 11, fontWeight: "500" },
            headerShown: false,
          })}
        >
          <Tab.Screen
            name="DogsTab"
            component={DogsStackNavigator}
            options={{ title: "Dogs" }}
          />
          <Tab.Screen
            name="BreedersTab"
            component={BreederDirectoryScreen}
            options={{ title: "Breeders" }}
          />
          <Tab.Screen
            name="HomeTab"
            component={DashboardScreen}
            options={{ title: "Home" }}
          />
          <Tab.Screen
            name="ShowsTab"
            component={ShowsScreen}
            options={{ title: "Shows" }}
          />
          <Tab.Screen
            name="ProfileTab"
            component={ProfileScreen}
            options={{ title: "Profile" }}
          />
        </Tab.Navigator>
      </NavigationContainer>
      <SplashTransition visible={transitioning} />
    </View>
  );
}
