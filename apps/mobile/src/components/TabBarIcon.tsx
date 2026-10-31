import React from 'react';
import { BookOpen, Compass, Flame, Home, User, Users } from 'lucide-react-native';

export type TabIconName = 'home' | 'learn' | 'practise' | 'startup-world' | 'network' | 'profile';

interface TabBarIconProps {
  name: TabIconName;
  color: string;
  size?: number;
  focused?: boolean;
}

export function TabBarIcon({ name, color, size = 24, focused }: TabBarIconProps) {
  const strokeWidth = 1.75;

  switch (name) {
    case 'home':
      return <Home size={size} color={color} strokeWidth={strokeWidth} />;
    case 'learn':
      return <BookOpen size={size} color={color} strokeWidth={strokeWidth} />;
    case 'practise':
      return (
        <Flame
          size={size}
          color={color}
          strokeWidth={strokeWidth}
          fill={focused ? color : 'none'}
        />
      );
    case 'startup-world':
      return <Compass size={size} color={color} strokeWidth={strokeWidth} />;
    case 'network':
      return <Users size={size} color={color} strokeWidth={strokeWidth} />;
    case 'profile':
      return <User size={size} color={color} strokeWidth={strokeWidth} />;
    default:
      return null;
  }
}
