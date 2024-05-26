import Auth from "~/shared/components/auth";
import Logo from "~/shared/components/logo";

const AuthPage = () => {
  return (
    <div className="h-screen w-screen">
      <div className="flex h-full w-full flex-col items-center justify-center">
        <div className="pb-8">
          <Logo />
        </div>
        <Auth />
      </div>
    </div>
  );
};

export default AuthPage;
