import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/theme';

type TabIconProps = {
  label: string;
  icon: string;
  focused: boolean;
};

function TabIcon({ label, icon, focused }: TabIconProps) {
  return (
    <View style={styles.tabItem}>
      <Text style={[styles.tabIcon, { opacity: focused ? 1 : 0.5 }]}>{icon}</Text>
      <Text style={[
        styles.tabLabel,
        { color: focused ? Colors.light.accentBlue : Colors.light.tabInactive }
      ]}>
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Home" icon="🏠" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Search" icon="🔍" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="applications"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Applied" icon="📋" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="cv-builder"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="CV" icon="📄" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Profile" icon="👤" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.light.tabBackground,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    height: 72,
    paddingBottom: 8,
    paddingTop: 4,
  },
  tabItem: {
    alignItems: 'center',
    gap: 3,
  },
  tabIcon: {
    fontSize: 22,
  },
  tabLabel: {
    ...Typography.micro,
    fontFamily: 'DMSans_500Medium',
  },
});
