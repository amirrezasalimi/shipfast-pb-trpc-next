"use client";
import { Button, Input } from "@nextui-org/react";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import { TbCheck } from "react-icons/tb";
import Logo from "~/shared/components/logo";
import { LINKS } from "~/shared/constants/links";
import { api } from "~/shared/utils/trpc/react";

const AuthForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isDone, setIsDone] = useState(false);

  const resetPassword = api.auth.resetPassword.useMutation();
  const onSubmit = () => {
    if (email === "") return;
    email;
    resetPassword
      .mutateAsync({ email })
      .then(() => {
        toast.success("Email sent successfully");
        setIsDone(true);
      })
      .catch((e) => {
        if (e instanceof Error) {
          toast.error(e.message);
        }
      });
  };
  return (
    <div className="h-screen w-screen">
      <div className="flex h-full w-full flex-col items-center justify-center gap-4">
        <div className="pb-8">
          <Logo />
        </div>
        <div className="w-full max-w-md">
          <div className="text-center text-2xl font-semibold">
            Forgot Password
          </div>
          <div className="mt-4 flex flex-col gap-4">
            {isDone ? (
              <div className="flex flex-col justify-center gap-2 text-center">
                <TbCheck className="mx-auto size-20 text-primary" />
                <div className="w-full text-lg font-normal text-zinc-800">
                  We have sent an email to <b>{email}</b> with instructions to
                  reset your password.
                </div>
                <Link href={LINKS.AUTH}>
                  <Button>Back to login</Button>
                </Link>
              </div>
            ) : (
              <>
                <Input
                  fullWidth
                  type="email"
                  placeholder="Email"
                  variant="bordered"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && onSubmit()}
                />
                <Button
                  color={email === "" ? "default" : "primary"}
                  disabled={email === "" || resetPassword.isPending}
                  isLoading={resetPassword.isPending}
                  onClick={onSubmit}
                >
                  Send
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForgotPassword;
