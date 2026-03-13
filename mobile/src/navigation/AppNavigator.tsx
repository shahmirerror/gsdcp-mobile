import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../lib/theme";

import DashboardScreen from "../screens/DashboardScreen";
import DogSearchScreen from "../screens/DogSearchScreen";
import DogProfileScreen from "../screens/DogProfileScreen";
import BreederDirectoryScreen from "../screens/BreederDirectoryScreen";
import ShowsScreen from "../screens/ShowsScreen";
import ProfileScreen from "../screens/ProfileScreen";

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
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "600" },
      }}
    >
      <DogsStack.Screen
        name="DogSearch"
        component={DogSearchScreen}
        options={{ title: "Dog Search" }}
      />
      <DogsStack.Screen
        name="DogProfile"
        component={DogProfileScreen}
        options={({ route }) => ({
          title: route.params?.name || "Dog Profile",
        })}
      />
    </DogsStack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap = "home";
            if (route.name === "HomeTab") iconName = focused ? "home" : "home-outline";
            else if (route.name === "DogsTab") iconName = focused ? "search" : "search-outline";
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
          headerStyle: { backgroundColor: COLORS.primary },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "600" },
        })}
      >
        <Tab.Screen
          name="HomeTab"
          component={DashboardScreen}
          options={{ title: "Home", headerTitle: "GSDCP" }}
        />
        <Tab.Screen
          name="DogsTab"
          component={DogsStackNavigator}
          options={{ title: "Dogs", headerShown: false }}
        />
        <Tab.Screen
          name="BreedersTab"
          component={BreederDirectoryScreen}
          options={{ title: "Breeders", headerTitle: "Breeder Directory" }}
        />
        <Tab.Screen
          name="ShowsTab"
          component={ShowsScreen}
          options={{ title: "Shows", headerTitle: "Shows" }}
        />
        <Tab.Screen
          name="ProfileTab"
          component={ProfileScreen}
          options={{ title: "Profile", headerTitle: "My Profile" }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
