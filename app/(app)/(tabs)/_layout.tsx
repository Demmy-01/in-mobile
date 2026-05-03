import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform, Animated } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Home, Search, ClipboardList, PenLine, User } from 'lucide-react-native';

type TabIconProps = {
  focused: boolean;
  IconComponent: any;
};

import { useEffect, useRef } from 'react';

function TabIcon({ focused, IconComponent }: TabIconProps) {
  const animValue = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(animValue, {
      toValue: focused ? 1 : 0,
      useNativeDriver: true,
      friction: 6,
      tension: 100,
    }).start();
  }, [focused]);

  const inactiveOpacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const inactiveTranslateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 16],
  });

  const activeOpacity = animValue.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 1, 1],
  });

  const activeTranslateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [16, -24],
  });

  const activeScale = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  return (
    <View style={styles.iconWrapper}>
      {/* Inactive State */}
      <Animated.View
        style={[
          styles.inactiveContainer,
          {
            opacity: inactiveOpacity,
            transform: [{ translateY: inactiveTranslateY }],
          },
        ]}
      >
        <IconComponent size={24} color="#64748B" strokeWidth={2} />
      </Animated.View>

      {/* Active State */}
      <Animated.View
        style={[
          styles.activeContainer,
          {
            opacity: activeOpacity,
            transform: [{ translateY: activeTranslateY }, { scale: activeScale }],
          },
        ]}
      >
        <View style={styles.activeIconCircle}>
          <IconComponent size={24} color="#1C315E" strokeWidth={2.5} />
        </View>
      </Animated.View>
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
            <TabIcon focused={focused} IconComponent={Home} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} IconComponent={Search} />
          ),
        }}
      />
      <Tabs.Screen
        name="applications"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} IconComponent={ClipboardList} />
          ),
        }}
      />
      <Tabs.Screen
        name="cv-builder"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} IconComponent={PenLine} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} IconComponent={User} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    height: Platform.OS === 'ios' ? 88 : 70,
    elevation: 0,
    shadowOpacity: 0,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 50, // Fixed height to stabilize the container
  },
  inactiveContainer: {
    position: 'absolute',
    top: 16,
  },
  activeContainer: {
    position: 'absolute',
    top: 16,
  },
  activeIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    // Shadow to create the cutout effect illusion
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    // Add a slight top border color to match the tab bar top border
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderBottomWidth: 0,
  },
});

