"use client";

import { useState } from "react";
import { Button, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, Stack } from "expo-router";
import { FlashList } from "@shopify/flash-list";

import { useSignIn, useSignOut, useUser } from "~/utils/auth";

// Define a static post type
interface Post {
  id: string;
  title: string;
  content: string;
}

// Static posts data
const STATIC_POSTS: Post[] = [
  {
    id: "1",
    title: "Welcome to T3 Turbo",
    content: "This is a static post to demonstrate the UI without API calls.",
  },
  {
    id: "2",
    title: "Getting Started",
    content: "Learn how to build amazing apps with T3 Turbo.",
  },
  {
    id: "3",
    title: "Features",
    content: "Explore the powerful features of T3 Turbo.",
  },
];

function PostCard(props: { post: Post; onDelete: () => void }) {
  return (
    <View className="flex flex-row rounded-lg bg-muted p-4">
      <View className="flex-grow">
        <Link
          asChild
          href={{
            pathname: '/',
            params: { id: props.post.id },
          }}
        >
          <Pressable className="">
            <Text className="text-xl font-semibold text-primary">
              {props.post.title}
            </Text>
            <Text className="mt-2 text-foreground">{props.post.content}</Text>
          </Pressable>
        </Link>
      </View>
      <Pressable onPress={props.onDelete}>
        <Text className="font-bold uppercase text-primary">Delete</Text>
      </Pressable>
    </View>
  );
}

function CreatePost() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleCreate = () => {
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required");
      return;
    }
    // In a real app, this would create a post
    // For now, just clear the form
    setTitle("");
    setContent("");
    setError(null);
  };

  return (
    <View className="mt-4 flex gap-2">
      <TextInput
        className="items-center rounded-md border border-input bg-background px-3 text-lg leading-[1.25] text-foreground"
        value={title}
        onChangeText={setTitle}
        placeholder="Title"
      />
      <TextInput
        className="items-center rounded-md border border-input bg-background px-3 text-lg leading-[1.25] text-foreground"
        value={content}
        onChangeText={setContent}
        placeholder="Content"
      />
      {error && <Text className="mb-2 text-destructive">{error}</Text>}
      <Pressable
        className="flex items-center rounded bg-primary p-2"
        onPress={handleCreate}
      >
        <Text className="text-foreground">Create</Text>
      </Pressable>
    </View>
  );
}

function MobileAuth() {
  const user = useUser();
  const signIn = useSignIn();
  const signOut = useSignOut();

  return (
    <>
      <Text className="pb-2 text-center text-xl font-semibold text-white">
        {user?.user_metadata.name ?? "Not logged in"}
      </Text>
      <Button
        onPress={() => (user ? signOut() : signIn())}
        title={user ? "Sign Out" : "Sign In With Discord"}
        color={"#5B65E9"}
      />
    </>
  );
}

export default function Index() {
  const [posts, setPosts] = useState<Post[]>(STATIC_POSTS);

  const handleDelete = (id: string) => {
    setPosts(posts.filter((post) => post.id !== id));
  };

  return (
    <SafeAreaView className="bg-background">
      <Stack.Screen options={{ title: "Home Page" }} />
      <View className="h-full w-full bg-background p-4">
        <Text className="pb-2 text-center text-5xl font-bold text-foreground">
          Create <Text className="text-primary">T3</Text> Turbo
        </Text>

        <MobileAuth />

        <View className="py-2">
          <Text className="font-semibold italic text-primary">
            Press on a post
          </Text>
        </View>

        <FlashList
          data={posts}
          estimatedItemSize={20}
          ItemSeparatorComponent={() => <View className="h-2" />}
          renderItem={(p) => (
            <PostCard post={p.item} onDelete={() => handleDelete(p.item.id)} />
          )}
        />

        <CreatePost />
      </View>
    </SafeAreaView>
  );
}
