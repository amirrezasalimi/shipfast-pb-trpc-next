import { useState } from "react";
import toast from "react-hot-toast";
import useAuth from "~/shared/hooks/auth/auth";
import { pb_client } from "~/shared/utils/pb-client";
import { ClientResponseError } from "pocketbase";
const useAuthFlow = () => {
  const auth = useAuth();
  const [currentAuthLoading, setCurrentAuthLoading] = useState<string | null>(
    null,
  );

  const open = async (name: string) => {
    setCurrentAuthLoading(name);

    try {
      const res = await pb_client.collection("users").authWithOAuth2({
        provider: "github",
      });
      if (res.token) {
        await auth.refresh();
      }
    } catch (e) {
      if (e instanceof ClientResponseError) {
        toast.error(e.message ?? "Failed to authenticate");
      }
    }
    setCurrentAuthLoading(null);
  };
  return {
    open,
    currentAuthLoading,
  };
};

export default useAuthFlow;
