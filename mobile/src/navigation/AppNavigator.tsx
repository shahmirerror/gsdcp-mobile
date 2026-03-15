import { Image, Platform } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../lib/theme";

import DashboardScreen from "../screens/DashboardScreen";
import DogSearchScreen from "../screens/DogSearchScreen";
import DogProfileScreen from "../screens/DogProfileScreen";
import BreederDirectoryScreen from "../screens/BreederDirectoryScreen";
import BreederProfileScreen from "../screens/BreederProfileScreen";
import ShowsScreen from "../screens/ShowsScreen";
import ProfileScreen from "../screens/ProfileScreen";

const logoSquare = require("../../assets/logo-square.png");

export type DogsStackParamList = {
  DogSearch: undefined;
  DogProfile: { id: string; name?: string };
};

export type BreedersStackParamList = {
  BreederDirectory: undefined;
  BreederProfile: { id: string; name?: string };
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
const BreedersStack = createNativeStackNavigator<BreedersStackParamList>();

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

function BreedersStackNavigator() {
  return (
    <BreedersStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <BreedersStack.Screen name="BreederDirectory" component={BreederDirectoryScreen} />
      <BreedersStack.Screen name="BreederProfile" component={BreederProfileScreen} />
    </BreedersStack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
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
          component={BreedersStackNavigator}
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
  );
}
