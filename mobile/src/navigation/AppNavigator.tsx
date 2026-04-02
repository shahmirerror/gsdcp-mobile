import { useMemo, useRef, useState } from "react";
import { Image, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  NavigationContainer,
  type NavigationState,
  type PartialState,
  type NavigatorScreenParams,
} from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../lib/theme";
import { useAuth } from "../contexts/AuthContext";

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
import MemberProfileScreen from "../screens/MemberProfileScreen";
import RecentMatingsScreen from "../screens/RecentMatingsScreen";

import TheClubScreen from "../screens/club/TheClubScreen";
import AboutGSDCPScreen from "../screens/club/AboutGSDCPScreen";
import SubscriptionScreen from "../screens/club/SubscriptionScreen";
import RulesRegulationsScreen from "../screens/club/RulesRegulationsScreen";
import TheTeamScreen from "../screens/club/TheTeamScreen";
import GSDCPJudgesScreen from "../screens/club/GSDCPJudgesScreen";
import VisitingJudgesScreen from "../screens/club/VisitingJudgesScreen";
import NewsUpdatesScreen from "../screens/club/NewsUpdatesScreen";
import NewsDetailScreen from "../screens/club/NewsDetailScreen";
import JudgeDetailScreen from "../screens/club/JudgeDetailScreen";

import VirtualBreedingScreen from "../screens/VirtualBreedingScreen";
import CustomTabBar from "./CustomTabBar";

export type DogsStackParamList = {
  DogSearch: undefined;
  DogProfile: { id: string; name?: string };
  BreederProfile: { id: string; name?: string; breederData?: any };
  MemberProfile: { id: string; member?: any };
  ShowDetail: { id: string; name?: string };
};

export type BreedersStackParamList = {
  BreederDirectory: undefined;
  BreederProfile: { id: string; name?: string; breederData?: any };
  KennelProfile: { id: string; name?: string };
  DogProfile: { id: string; name?: string };
  MemberProfile: { id: string; member?: any };
  ShowDetail: { id: string; name?: string };
};

export type ShowsStackParamList = {
  ShowsList: undefined;
  ShowDetail: { id: string; name?: string };
  DogProfile: { id: string; name?: string };
  JudgeDetail: { id: string; backLabel?: string };
  MemberProfile: { id: string; member?: any };
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  LoginRegister: undefined;
  KennelProfile: { id: string; name?: string };
  DogProfile: { id: string; name?: string };
  MemberProfile: { id: string; member?: any };
  ShowDetail: { id: string; name?: string };
};

export type RecentMatingsStackParamList = {
  RecentMatingsList: undefined;
  DogProfile: { id: string; name?: string };
  KennelProfile: { id: string; name?: string };
  MemberProfile: { id: string; member?: any };
  ShowDetail: { id: string; name?: string };
};

export type MemberDirectoryStackParamList = {
  MemberDirectory: undefined;
  MemberProfile: { id: string; member?: any };
  DogProfile: { id: string; name?: string };
  ShowDetail: { id: string; name?: string };
};

export type KennelDirectoryStackParamList = {
  KennelDirectory: undefined;
  KennelProfile: { id: string; name?: string };
  DogProfile: { id: string; name?: string };
  MemberProfile: { id: string; member?: any };
  ShowDetail: { id: string; name?: string };
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
  NewsDetail: { item: { id: number; title: string; content: string } };
  JudgeDetail: { id: string; backLabel?: string };
  ShowDetail: { id: string; name?: string };
};

export type RootTabParamList = {
  HomeTab: undefined;
  DogsTab: NavigatorScreenParams<DogsStackParamList> | undefined;
  BreedersTab: NavigatorScreenParams<BreedersStackParamList> | undefined;
  ShowsTab: NavigatorScreenParams<ShowsStackParamList> | undefined;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList> | undefined;
  KennelDirectoryTab: NavigatorScreenParams<KennelDirectoryStackParamList> | undefined;
  MemberDirectoryTab: NavigatorScreenParams<MemberDirectoryStackParamList> | undefined;
  RecentMatingsTab: NavigatorScreenParams<RecentMatingsStackParamList> | undefined;
  TheClubTab: NavigatorScreenParams<TheClubStackParamList> | undefined;
  VirtualBreedingTab: undefined;
};

type NavTreeState = NavigationState | PartialState<NavigationState>;

const LIGHT_STATUS_BAR_ROUTES = new Set<string>([
  "HomeTab",
  "LoginRegister",
  "TheClubHome",
]);

function getActiveRouteName(state: NavTreeState | undefined): string {
  if (!state || !state.routes || state.routes.length === 0) {
    return "HomeTab";
  }

  const index = state.index ?? 0;
  const route = state.routes[index] as
    | {
        name: string;
        state?: NavTreeState;
      }
    | undefined;

  if (!route) {
    return "HomeTab";
  }

  if (route.state) {
    return getActiveRouteName(route.state);
  }

  return route.name;
}

const Tab = createBottomTabNavigator<RootTabParamList>();
const DogsStack = createNativeStackNavigator<DogsStackParamList>();
const BreedersStack = createNativeStackNavigator<BreedersStackParamList>();
const ShowsStack = createNativeStackNavigator<ShowsStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const RecentMatingsStack = createNativeStackNavigator<RecentMatingsStackParamList>();
const KennelDirectoryStack = createNativeStackNavigator<KennelDirectoryStackParamList>();
const MemberDirectoryStack = createNativeStackNavigator<MemberDirectoryStackParamList>();
const TheClubStack = createNativeStackNavigator<TheClubStackParamList>();

function DogsStackNavigator() {
  return (
    <DogsStack.Navigator screenOptions={{ headerShown: false }}>
      <DogsStack.Screen name="DogSearch" component={DogSearchScreen} />
      <DogsStack.Screen name="DogProfile" component={DogProfileScreen} />
      <DogsStack.Screen name="BreederProfile" component={BreederProfileScreen} />
      <DogsStack.Screen name="MemberProfile" component={MemberProfileScreen} />
      <DogsStack.Screen name="ShowDetail" component={ShowDetailScreen} />
    </DogsStack.Navigator>
  );
}

function BreedersStackNavigator() {
  return (
    <BreedersStack.Navigator screenOptions={{ headerShown: false }}>
      <BreedersStack.Screen name="BreederDirectory" component={BreederDirectoryScreen} />
      <BreedersStack.Screen name="BreederProfile" component={BreederProfileScreen} />
      <BreedersStack.Screen name="KennelProfile" component={KennelProfileScreen} />
      <BreedersStack.Screen name="DogProfile" component={DogProfileScreen} />
      <BreedersStack.Screen name="MemberProfile" component={MemberProfileScreen} />
      <BreedersStack.Screen name="ShowDetail" component={ShowDetailScreen} />
    </BreedersStack.Navigator>
  );
}

function ShowsStackNavigator() {
  return (
    <ShowsStack.Navigator screenOptions={{ headerShown: false }}>
      <ShowsStack.Screen name="ShowsList" component={ShowsScreen} />
      <ShowsStack.Screen name="ShowDetail" component={ShowDetailScreen} />
      <ShowsStack.Screen name="DogProfile" component={DogProfileScreen} />
      <ShowsStack.Screen name="JudgeDetail" component={JudgeDetailScreen} />
      <ShowsStack.Screen name="MemberProfile" component={MemberProfileScreen} />
    </ShowsStack.Navigator>
  );
}

function ProfileStackNavigator() {
  const { isLoggedIn, isLoading } = useAuth();
  // Wait for the stored session to restore before rendering
  if (isLoading) return null;
  // Conditional screen rendering is the recommended React Navigation auth pattern.
  // The navigator automatically animates to whichever screen is in the stack,
  // so no goBack() / key tricks are needed.
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      {isLoggedIn ? (
        <>
          <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} />
          <ProfileStack.Screen name="KennelProfile" component={KennelProfileScreen} />
          <ProfileStack.Screen name="DogProfile" component={DogProfileScreen} />
          <ProfileStack.Screen name="MemberProfile" component={MemberProfileScreen} />
          <ProfileStack.Screen name="ShowDetail" component={ShowDetailScreen} />
        </>
      ) : (
        <ProfileStack.Screen name="LoginRegister" component={LoginRegisterScreen} />
      )}
    </ProfileStack.Navigator>
  );
}

function RecentMatingsStackNavigator() {
  return (
    <RecentMatingsStack.Navigator screenOptions={{ headerShown: false }}>
      <RecentMatingsStack.Screen name="RecentMatingsList" component={RecentMatingsScreen} />
      <RecentMatingsStack.Screen name="DogProfile" component={DogProfileScreen} />
      <RecentMatingsStack.Screen name="KennelProfile" component={KennelProfileScreen} />
      <RecentMatingsStack.Screen name="MemberProfile" component={MemberProfileScreen} />
      <RecentMatingsStack.Screen name="ShowDetail" component={ShowDetailScreen} />
    </RecentMatingsStack.Navigator>
  );
}

function MemberDirectoryStackNavigator() {
  return (
    <MemberDirectoryStack.Navigator screenOptions={{ headerShown: false }}>
      <MemberDirectoryStack.Screen name="MemberDirectory" component={MemberDirectoryScreen} />
      <MemberDirectoryStack.Screen name="MemberProfile" component={MemberProfileScreen} />
      <MemberDirectoryStack.Screen name="DogProfile" component={DogProfileScreen} />
      <MemberDirectoryStack.Screen name="ShowDetail" component={ShowDetailScreen} />
    </MemberDirectoryStack.Navigator>
  );
}

function KennelDirectoryStackNavigator() {
  return (
    <KennelDirectoryStack.Navigator screenOptions={{ headerShown: false }}>
      <KennelDirectoryStack.Screen name="KennelDirectory" component={KennelDirectoryScreen} />
      <KennelDirectoryStack.Screen name="KennelProfile" component={KennelProfileScreen} />
      <KennelDirectoryStack.Screen name="DogProfile" component={DogProfileScreen} />
      <KennelDirectoryStack.Screen name="MemberProfile" component={MemberProfileScreen} />
      <KennelDirectoryStack.Screen name="ShowDetail" component={ShowDetailScreen} />
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
      <TheClubStack.Screen name="NewsDetail" component={NewsDetailScreen} />
      <TheClubStack.Screen name="JudgeDetail" component={JudgeDetailScreen} />
      <TheClubStack.Screen name="ShowDetail" component={ShowDetailScreen} />
    </TheClubStack.Navigator>
  );
}

export default function AppNavigator() {
  const navRef = useRef<any>(null);
  const [activeRouteName, setActiveRouteName] = useState("HomeTab");

  const statusBarStyle = useMemo<"light" | "dark">(
    () => (LIGHT_STATUS_BAR_ROUTES.has(activeRouteName) ? "light" : "dark"),
    [activeRouteName]
  );

  return (
    <>
      <NavigationContainer
        ref={navRef}
        onReady={() => {
          const rootState = navRef.current?.getRootState?.() as NavTreeState | undefined;
          setActiveRouteName(getActiveRouteName(rootState));
        }}
        onStateChange={(state) => {
          setActiveRouteName(getActiveRouteName(state as NavTreeState | undefined));
        }}
      >
        <Tab.Navigator
          initialRouteName="HomeTab"
          tabBar={(props) => <CustomTabBar {...props} />}
          screenOptions={{ headerShown: false }}
        >
          <Tab.Screen name="DogsTab" component={DogsStackNavigator} options={{ title: "Dogs" }} />
          <Tab.Screen name="BreedersTab" component={BreedersStackNavigator} options={{ title: "Active Breeders" }} />
          <Tab.Screen name="HomeTab" component={DashboardScreen} options={{ title: "Home" }} />
          <Tab.Screen name="ShowsTab" component={ShowsStackNavigator} options={{ title: "Shows" }} />
          <Tab.Screen name="ProfileTab" component={ProfileStackNavigator} options={{ title: "Profile" }} />
          <Tab.Screen name="KennelDirectoryTab" component={KennelDirectoryStackNavigator} />
          <Tab.Screen name="MemberDirectoryTab" component={MemberDirectoryStackNavigator} />
          <Tab.Screen name="RecentMatingsTab" component={RecentMatingsStackNavigator} />
          <Tab.Screen name="TheClubTab" component={TheClubStackNavigator} />
          <Tab.Screen name="VirtualBreedingTab" component={VirtualBreedingScreen} />
        </Tab.Navigator>
      </NavigationContainer>
      <StatusBar
        style={statusBarStyle}
        backgroundColor={COLORS.background}
        translucent={false}
      />
    </>
  );
}
