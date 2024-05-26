"use client";
import { Button, CircularProgress, Input, cn } from "@nextui-org/react";
import { useMutation } from "@tanstack/react-query";
import useAuthFlow from "./hooks/auth-flow";

import toast from "react-hot-toast";
import { TbArrowLeft, TbBrandGithub, TbChevronRight } from "react-icons/tb";
import { useRouter, useSearchParams } from "next/navigation";
import { pb_client } from "~/shared/utils/pb-client";
import useAuth from "~/shared/hooks/auth/auth";
import { LINKS } from "~/shared/constants/links";
import { api } from "~/shared/utils/trpc/react";
import { type ReactNode, useState } from "react";
import Link from "next/link";
import Avatar from "../avatar";

const ProviderItem = ({
  icon,
  provider,
  loading,
  onClick,
}: {
  provider: string;
  icon: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "inline-flex w-full cursor-pointer items-center justify-center gap-4 rounded-2xl border bg-white p-3",
        loading ? "cursor-wait opacity-50" : "hover:opacity-80",
      )}
    >
      {icon}
      <span className="text-center text-lg font-normal text-zinc-800">
        Continue With {provider}
      </span>
    </div>
  );
};

const authProviders: {
  id: string;
  icon: ReactNode;
  title: string;
  enabled: boolean;
}[] = [
  {
    id: "github",
    icon: <TbBrandGithub className="h-6 w-6" />,
    title: "Github",
    enabled: true,
  },
];

const Auth = ({ head = true }: { head?: boolean }) => {
  const params = useSearchParams();

  if (params.get("token")) {
    pb_client.authStore.save(params.get("token")!);
    window.location.href = LINKS.DASHBOARD;
  }

  const auth = useAuthFlow();
  const { isLogin, refresh, onLogin, logout, user, status } = useAuth();
  const nav = useRouter();
  const authCheck = status == "pending";
  const isLoginned = status == "success" && isLogin;

  const checkUserExists = api.auth.userExists.useMutation();
  const register = api.auth.registerUser.useMutation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<"email" | "verify" | "login" | "register">(
    "email",
  );
  const checkeEmail = async () => {
    setPassword("");
    checkUserExists.mutateAsync({ email }).then((res) => {
      if (email.trim() == "") return toast.error("Email is required");

      if (typeof res != "boolean" && !res.has_password) {
        return toast.error("Email already registered with oauth provider");
      }
      if (res) {
        setStep("login");
      } else {
        setStep("register");
      }
    });
  };
  const loginAction = useMutation({
    mutationFn: async () => {
      return await pb_client
        .collection("users")
        .authWithPassword(email, password)
        .then(async (res) => {
          if (res) {
            await refresh();
            onLogin();
            nav.replace(LINKS.DASHBOARD);
          }
        });
    },
    onError(error) {
      if (error.message.includes("Failed to authenticate.")) {
        return toast.error("Wrong password");
      }
      toast.error(error.message);
    },
  });
  const registerAction = async () => {
    register
      .mutateAsync({
        email,
        password,
      })
      .then(() => {
        toast.success("Account created successfully");
        return loginAction.mutateAsync();
      });
  };
  return (
    <div className="flex w-full max-w-md flex-col items-center justify-center px-4">
      {authCheck && (
        <>
          <CircularProgress size="lg" />
        </>
      )}
      {isLoginned && (
        <>
          <div className="flex w-full justify-start py-6">
            <span className="text-center text-xl font-semibold">
              continue as
            </span>
          </div>
          <Link className="w-full" href={LINKS.DASHBOARD}>
            <div
              className="bg-background-500 hover:bg-background-800 flex w-full cursor-pointer items-center justify-between rounded-2xl border px-6 py-4 transition-all"
            >
              <div className="flex items-center gap-3">
                <Avatar name={user?.email || ""} src={user?.avatar} />
                <div className="flex flex-col items-start justify-center">
                  <span className=" font-semibold">{user?.username}</span>
                  <span className=" ">{user?.email}</span>
                </div>
              </div>
              <TbChevronRight className="h-[32px] w-[32px] text-gray-400" />
            </div>
          </Link>
          <div className="mt-4 flex w-full flex-col gap-2 text-center ">
            <span className="cursor-pointer text-red-500" onClick={logout}>
              Logout
            </span>
          </div>
        </>
      )}
      {!authCheck && !isLogin && (
        <>
          {head && (
            <div className="flex w-full justify-start py-3">
              <span className="text-center text-xl font-semibold">
                {step == "email" && "welcome"}
              </span>
            </div>
          )}
          <div className="flex w-full flex-col gap-2 ">
            {step == "email" && (
              <>
                <Input
                  fullWidth
                  placeholder="Email"
                  type="email"
                  autoComplete="email"
                  variant="bordered"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button
                  isLoading={checkUserExists.isPending}
                  onClick={checkeEmail}
                  fullWidth
                  size="lg"
                  className="mt-2 bg-blue-500 text-white"
                >
                  Continue
                </Button>
              </>
            )}
            {step == "login" && (
              <div className="mt-2 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <TbArrowLeft
                    fontSize={24}
                    onClick={() => setStep("email")}
                    className="cursor-pointer"
                  />
                  <div className="text-md flex gap-1 font-semibold">
                    <span>Login as</span>
                    <span className="text-blue-500">{email}</span>
                  </div>
                </div>
                <Input
                  fullWidth
                  placeholder="Password"
                  type="password"
                  autoComplete="current-password"
                  variant="bordered"
                  value={password}
                  className="mt-2"
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div className="flex w-full flex-col items-end gap-2 pb-2">
                  <Link href={LINKS.FORGOT_PASSWORD}>
                    <Button
                      variant="light"
                      color="primary"
                      size="sm"
                      className="w-auto"
                    >
                      Forgot password?
                    </Button>
                  </Link>
                </div>
                <Button
                  onClick={() => loginAction.mutate()}
                  isLoading={loginAction.isPending}
                  fullWidth
                  size="lg"
                  className="bg-blue-500 text-white"
                >
                  Login
                </Button>
              </div>
            )}
            {step == "register" && (
              <>
                <div className="flex items-center gap-2">
                  <TbArrowLeft
                    fontSize={24}
                    onClick={() => setStep("email")}
                    className=" cursor-pointer"
                  />
                  <div className=" text-md font-semibold">
                    Register as &nbsp;
                    <span className="text-blue-500">{email}</span>
                  </div>
                </div>
                <Input
                  className="mt-2"
                  fullWidth
                  placeholder="Password"
                  type="password"
                  autoComplete="new-password"
                  variant="bordered"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button
                  onClick={registerAction}
                  isLoading={register.isPending || loginAction.isPending}
                  fullWidth
                  size="lg"
                  className="bg-blue-500 text-white"
                >
                  Register
                </Button>
              </>
            )}
          </div>
          {/* login with oauth providers */}
          <div className="mt-8 flex w-full flex-col gap-2">
            {authProviders.map((provider) => (
              <ProviderItem
                key={provider.id}
                onClick={() => auth.open(provider.id)}
                loading={auth.currentAuthLoading == provider.id}
                provider={provider.title}
                icon={
                  <div className="flex items-center justify-center">
                    {provider.icon}
                  </div>
                }
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
export default Auth;
