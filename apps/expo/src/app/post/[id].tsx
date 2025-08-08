import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function PostDetail() {
  const { id } = useLocalSearchParams();
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text className="text-2xl font-bold text-primary">Post ID: {id}</Text>
      {/* You can fetch and display post details here using the id */}
    </View>
  );
}
