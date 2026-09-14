import React, { Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <View className="flex-1 justify-center items-center p-6 bg-white">
          <Text className="text-xl font-bold mb-3">Terjadi Kesalahan</Text>
          <Text className="text-sm text-center text-[#666] mb-6">{this.state.error.message}</Text>
          <TouchableOpacity
            className="px-6 py-3 bg-[#007AFF] rounded-xl"
            onPress={() => this.setState({ error: null })}
          >
            <Text className="text-white font-semibold">Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}
