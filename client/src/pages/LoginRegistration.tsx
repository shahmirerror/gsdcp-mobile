import {
  ArrowRightIcon,
  LockIcon,
  MessageCircleIcon,
  UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export const LoginRegistration = (): JSX.Element => {
  return (
    <div className="flex flex-col min-h-screen items-start justify-between bg-[#f5f5f2]">
      <header className="flex flex-col items-center pt-12 pb-8 px-6 w-full">
        <img
          className="w-[120px] h-[120px]"
          alt="GSDCP Logo"
          src="/figmaAssets/margin.svg"
        />

        <h1 className="[font-family:'Inter',Helvetica] font-bold text-[#0f5c3b] text-2xl text-center tracking-[-0.60px] leading-8 whitespace-nowrap mt-2">
          GSDCP
        </h1>

        <p className="[font-family:'Inter',Helvetica] font-normal text-[#0f5c3bb2] text-xs text-center tracking-[1.20px] leading-4 whitespace-nowrap mt-1">
          GERMAN SHEPHERD DOG CLUB OF PAKISTAN
        </p>
      </header>

      <section className="flex flex-col items-start pb-6 px-6 w-full">
        <Card className="h-48 w-full rounded-xl overflow-hidden border border-slate-200 shadow-[0px_2px_4px_-2px_#0000001a,0px_4px_6px_-1px_#0000001a]">
          <CardContent className="h-full p-0 [background:url(/figmaAssets/hero---visual-element.png)_50%_50%_/_cover]">
            <div className="flex flex-col items-start justify-end p-4 h-full bg-[linear-gradient(0deg,rgba(0,0,0,0.6)_0%,rgba(0,0,0,0)_100%)]">
              <p className="[font-family:'Inter',Helvetica] font-medium text-white text-sm tracking-[0] leading-5">
                Preserving the standard of the breed since
                <br />
                1978
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col items-start pb-6 px-6 w-full">
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="w-full h-auto bg-transparent p-0 border-b border-slate-200">
            <TabsTrigger
              value="login"
              className="flex-1 h-auto py-2 px-0 data-[state=active]:border-b-2 data-[state=active]:border-[#0f5c3b] data-[state=active]:bg-transparent rounded-none border-b-2 border-transparent"
            >
              <span className="[font-family:'Inter',Helvetica] font-bold data-[state=active]:text-[#0f5c3b] text-slate-400 text-sm tracking-[0.70px] leading-5">
                LOGIN
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="register"
              className="flex-1 h-auto py-2 px-0 data-[state=active]:border-b-2 data-[state=active]:border-[#0f5c3b] data-[state=active]:bg-transparent rounded-none border-b-2 border-transparent"
            >
              <span className="[font-family:'Inter',Helvetica] font-bold data-[state=active]:text-[#0f5c3b] text-slate-400 text-sm tracking-[0.70px] leading-5">
                REGISTER
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-0">
            <div className="flex flex-col items-start gap-8 pt-6 pb-6">
              <div className="flex flex-col items-start gap-5 w-full">
                <div className="flex flex-col items-start w-full">
                  <h2 className="[font-family:'Inter',Helvetica] font-bold text-[#0f5c3b] text-xl tracking-[0] leading-[25px]">
                    Welcome Back
                  </h2>
                </div>

                <div className="flex flex-col items-start w-full">
                  <p className="[font-family:'Inter',Helvetica] font-normal text-slate-500 text-sm tracking-[0] leading-5">
                    Sign in to manage your kennel and pedigrees.
                  </p>
                </div>

                <div className="flex flex-col items-start gap-4 pt-2 w-full">
                  <div className="flex flex-col items-start w-full">
                    <Label
                      htmlFor="email"
                      className="[font-family:'Inter',Helvetica] font-bold text-slate-700 text-xs tracking-[0.60px] leading-4 pl-1 pb-2"
                    >
                      EMAIL OR MEMBERSHIP ID
                    </Label>
                    <div className="relative w-full">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-[13px] h-[13px] text-gray-500" />
                      <Input
                        id="email"
                        type="text"
                        defaultValue="GSDCP-XXXX-2024"
                        className="h-14 pl-12 [font-family:'Inter',Helvetica] font-normal text-gray-500 text-base bg-white rounded-lg border border-slate-200"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col items-start w-full">
                    <Label
                      htmlFor="password"
                      className="[font-family:'Inter',Helvetica] font-bold text-slate-700 text-xs tracking-[0.60px] leading-4 pl-1 pb-2"
                    >
                      PASSWORD
                    </Label>
                    <div className="relative w-full">
                      <LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-[13px] h-[13px] text-gray-500" />
                      <Input
                        id="password"
                        type="password"
                        defaultValue="••••••••"
                        className="h-14 pl-12 [font-family:'Inter',Helvetica] font-normal text-gray-500 text-base bg-white rounded-lg border border-slate-200"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-start justify-end w-full">
                  <button className="[font-family:'Inter',Helvetica] font-normal text-[#0f5c3b] text-sm tracking-[0] leading-5 whitespace-nowrap">
                    Forgot Password?
                  </button>
                </div>

                <Button className="w-full h-auto py-4 bg-[#0f5c3b] hover:bg-[#0d4d30] rounded-lg shadow-[0px_4px_6px_-4px_#0000001a,0px_10px_15px_-3px_#0000001a]">
                  <span className="[font-family:'Inter',Helvetica] font-bold text-white text-base text-center tracking-[0] leading-6">
                    SIGN IN
                  </span>
                  <ArrowRightIcon className="w-4 h-4 ml-2" />
                </Button>
              </div>

              <div className="flex items-center justify-center gap-4 w-full">
                <Separator className="flex-1 bg-slate-200" />
                <span className="[font-family:'Inter',Helvetica] font-medium text-slate-400 text-xs tracking-[1.20px] leading-4 whitespace-nowrap">
                  WUSV AFFILIATE
                </span>
                <Separator className="flex-1 bg-slate-200" />
              </div>

              <div className="flex flex-col items-center gap-2 w-full">
                <p className="[font-family:'Inter',Helvetica] font-normal text-slate-500 text-sm text-center tracking-[0] leading-5 whitespace-nowrap">
                  Need assistance with your registration?
                </p>

                <button className="inline-flex gap-1 items-center justify-center">
                  <MessageCircleIcon className="w-4 h-4 text-[#c7a45c]" />
                  <span className="[font-family:'Inter',Helvetica] font-bold text-[#c7a45c] text-sm text-center tracking-[0.70px] leading-5 whitespace-nowrap">
                    CONTACT SUPPORT
                  </span>
                </button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="register" className="mt-0">
            <div className="flex flex-col items-center justify-center py-12">
              <p className="[font-family:'Inter',Helvetica] font-normal text-slate-500 text-sm text-center">
                Registration form content goes here
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </section>

      <footer className="flex flex-col items-start pb-6 w-full">
        <div className="flex flex-col items-center w-full">
          <p className="[font-family:'Inter',Helvetica] font-medium text-slate-400 text-[10px] text-center tracking-[-0.50px] leading-[15px] whitespace-nowrap">
            © 2024 GERMAN SHEPHERD DOG CLUB OF PAKISTAN. ALL RIGHTS RESERVED.
          </p>
        </div>
      </footer>
    </div>
  );
};
