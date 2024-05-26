import { useQuery } from "@tanstack/react-query";
import { pb_client } from "~/shared/utils/pb-client";

const useAuth = () => {
  const isLoginned = useQuery({
    queryKey: ["pb-auth"],
    queryFn: async () => {
      if (pb_client.authStore?.token) {
        await pb_client.collection("users").authRefresh();
        return pb_client.authStore.isValid;
      }
      return false;
    },
  });
  const logout = async () => {
    pb_client.authStore.clear()
    await isLoginned.refetch();
  };
  const refresh = async () => {
    await isLoginned.refetch();
  };
  const onLogin = async () => {
    document.cookie = pb_client.authStore.exportToCookie({
      httpOnly: false,
    });
  }
  return {
    status: isLoginned.status,
    isLogin: isLoginned.data,
    user: pb_client.authStore.model,
    logout,
    refresh,
    onLogin
  };
};

export default useAuth;
