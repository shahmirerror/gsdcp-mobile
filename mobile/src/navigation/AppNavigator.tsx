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
import ShowDetailScreen from "../screens/ShowDetailScreen";
import ProfileScreen from "../screens/ProfileScreen";
import LoginRegisterScreen from "../screens/LoginRegisterScreen";
import KennelDirectoryScreen from "../screens/KennelDirectoryScreen";
import KennelProfileScreen from "../screens/KennelProfileScreen";
import MemberDirectoryScreen from "../screens/MemberDirectoryScreen";
import RecentMatingsScreen from "../screens/RecentMatingsScreen";

import TheClubScreen from "../screens/club/TheClubScreen";
import AboutGSDCPScreen from "../screens/club/AboutGSDCPScreen";
import SubscriptionScreen from "../screens/club/SubscriptionScreen";
import RulesRegulationsScreen from "../screens/club/RulesRegulationsScreen";
import TheTeamScreen from "../screens/club/TheTeamScreen";
import GSDCPJudgesScreen from "../screens/club/GSDCPJudgesScreen";
import VisitingJudgesScreen from "../screens/club/VisitingJudgesScreen";
import NewsUpdatesScreen from "../screens/club/NewsUpdatesScreen";

import CustomTabBar from "./CustomTabBar";

export type DogsStackParamList = {
  DogSearch: undefined;
  DogProfile: { id: string; name?: string };
  BreederProfile: { id: string; name?: string };
};

export type BreedersStackParamList = {
  BreederDirectory: undefined;
  BreederProfile: { id: string; name?: string };
  DogProfile: { id: string; name?: string };
};

export type ShowsStackParamList = {
  ShowsList: undefined;
  ShowDetail: { id: string; name?: string };
  DogProfile: { id: string; name?: string };
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  LoginRegister: undefined;
};

export type KennelDirectoryStackParamList = {
  KennelDirectory: undefined;
  KennelProfile: { id: string; name?: string };
};

export type TheClubStackParamList = {
  TheClubHome: undefined;
  AboutGSDCP: undefined;
  Subscription: undefined;
  RulesRegulations: undefined;
  TheTeam: undefined;
  GSDCPJudges: undefined;
  VisitingJudges: undefined;
  NewsUpdates: undefined;
};

export type RootTabParamList = {
  HomeTab: undefined;
  DogsTab: undefined;
  BreedersTab: undefined;
  ShowsTab: undefined;
  ProfileTab: undefined;
  KennelDirectoryTab: undefined;
  MemberDirectoryTab: undefined;
  RecentMatingsTab: undefined;
  TheClubTab: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const DogsStack = createNativeStackNavigator<DogsStackParamList>();
const BreedersStack = createNativeStackNavigator<BreedersStackParamList>();
const ShowsStack = createNativeStackNavigator<ShowsStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const KennelDirectoryStack = createNativeStackNavigator<KennelDirectoryStackParamList>();
const TheClubStack = createNativeStackNavigator<TheClubStackParamList>();

function DogsStackNavigator() {
  return (
    <DogsStack.Navigator screenOptions={{ headerShown: false }}>
      <DogsStack.Screen name="DogSearch" component={DogSearchScreen} />
      <DogsStack.Screen name="DogProfile" component={DogProfileScreen} />
      <DogsStack.Screen name="BreederProfile" component={BreederProfileScreen} />
    </DogsStack.Navigator>
  );
}

function BreedersStackNavigator() {
  return (
    <BreedersStack.Navigator screenOptions={{ headerShown: false }}>
      <BreedersStack.Screen name="BreederDirectory" component={BreederDirectoryScreen} />
      <BreedersStack.Screen name="BreederProfile" component={BreederProfileScreen} />
      <BreedersStack.Screen name="DogProfile" component={DogProfileScreen} />
    </BreedersStack.Navigator>
  );
}

function ShowsStackNavigator() {
  return (
    <ShowsStack.Navigator screenOptions={{ headerShown: false }}>
      <ShowsStack.Screen name="ShowsList" component={ShowsScreen} />
      <ShowsStack.Screen name="ShowDetail" component={ShowDetailScreen} />
      <ShowsStack.Screen name="DogProfile" component={DogProfileScreen} />
    </ShowsStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} />
      <ProfileStack.Screen name="LoginRegister" component={LoginRegisterScreen} />
    </ProfileStack.Navigator>
  );
}

function KennelDirectoryStackNavigator() {
  return (
    <KennelDirectoryStack.Navigator screenOptions={{ headerShown: false }}>
      <KennelDirectoryStack.Screen name="KennelDirectory" component={KennelDirectoryScreen} />
      <KennelDirectoryStack.Screen name="KennelProfile" component={KennelProfileScreen} />
    </KennelDirectoryStack.Navigator>
  );
}

function TheClubStackNavigator() {
  return (
    <TheClubStack.Navigator screenOptions={{ headerShown: false }}>
      <TheClubStack.Screen name="TheClubHome" component={TheClubScreen} />
      <TheClubStack.Screen name="AboutGSDCP" component={AboutGSDCPScreen} />
      <TheClubStack.Screen name="Subscription" component={SubscriptionScreen} />
      <TheClubStack.Screen name="RulesRegulations" component={RulesRegulationsScreen} />
      <TheClubStack.Screen name="TheTeam" component={TheTeamScreen} />
      <TheClubStack.Screen name="GSDCPJudges" component={GSDCPJudgesScreen} />
      <TheClubStack.Screen name="VisitingJudges" component={VisitingJudgesScreen} />
      <TheClubStack.Screen name="NewsUpdates" component={NewsUpdatesScreen} />
    </TheClubStack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="HomeTab"
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tab.Screen name="DogsTab" component={DogsStackNavigator} options={{ title: "Dogs" }} />
        <Tab.Screen name="BreedersTab" component={BreedersStackNavigator} options={{ title: "Breeders" }} />
        <Tab.Screen name="HomeTab" component={DashboardScreen} options={{ title: "Home" }} />
        <Tab.Screen name="ShowsTab" component={ShowsStackNavigator} options={{ title: "Shows" }} />
        <Tab.Screen name="ProfileTab" component={ProfileStackNavigator} options={{ title: "Profile" }} />
        <Tab.Screen name="KennelDirectoryTab" component={KennelDirectoryStackNavigator} />
        <Tab.Screen name="MemberDirectoryTab" component={MemberDirectoryScreen} />
        <Tab.Screen name="RecentMatingsTab" component={RecentMatingsScreen} />
        <Tab.Screen name="TheClubTab" component={TheClubStackNavigator} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
