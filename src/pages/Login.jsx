import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/attenwell-logo.jpg";

const Login = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error("Please fill in all fields");
      return;
    }

    const result = await login(formData);
    
    if (result.success) {
      toast.success("Login successful!");
      navigate("/home");
    } else {
      toast.error(result.error || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-md">
        {/* Elegant Logo Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="mb-5">
            <div className="relative w-24 h-24 rounded-full bg-white border-[3px] border-gray-100 p-1 shadow-xl">
              <img 
                src={logo} 
                alt="AttenWell" 
                className="w-full h-full rounded-full object-cover"
              />
            </div>
          </div>
          
          <div className="flex flex-col items-center">
            <h1 className="text-[22px] font-bold text-slate-800 tracking-[3px] mb-2">
              ATTENWELL
            </h1>
            <div className="w-12 h-[2px] bg-amber-600 rounded mb-2" />
            <p className="text-[11px] text-gray-500 font-medium tracking-[1.2px] uppercase">
              Your Wellness Journey
            </p>
          </div>
        </div>

        {/* Header Section */}
        <div className="text-center mb-6">
          <h2 className="text-[26px] font-light text-slate-800 mb-2 tracking-wide">
            Welcome Back
          </h2>
          <p className="text-sm text-gray-500 tracking-wide">
            Sign in to continue your journey
          </p>
        </div>

        {/* Form Section */}
        <Card className="border-0 shadow-none bg-transparent">
          <CardContent className="p-0">
            {/* Section Header */}
            <div className="flex items-center mb-5">
              <div className="flex-1 h-[1px] bg-gray-200" />
              <span className="text-[9px] font-bold text-gray-400 tracking-[1.5px] mx-3">
                ACCOUNT DETAILS
              </span>
              <div className="flex-1 h-[1px] bg-gray-200" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-[18px]">
              {/* Email Input Group */}
              <div className="mb-1">
                <div className="flex items-center mb-2">
                  <div className="w-[5px] h-[5px] rounded-full bg-amber-600 mr-2" />
                  <Label 
                    htmlFor="email" 
                    className="text-[10px] font-bold text-gray-400 tracking-[1.2px]"
                  >
                    EMAIL ADDRESS
                  </Label>
                </div>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="h-[54px] bg-gray-50 border-2 border-gray-200 rounded-[14px] pl-12 pr-4 text-slate-800 font-medium tracking-wide placeholder:text-gray-300 focus:border-gray-300 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    required
                  />
                </div>
              </div>

              {/* Password Input Group */}
              <div className="mb-1">
                <div className="flex items-center mb-2">
                  <div className="w-[5px] h-[5px] rounded-full bg-amber-600 mr-2" />
                  <Label 
                    htmlFor="password" 
                    className="text-[10px] font-bold text-gray-400 tracking-[1.2px]"
                  >
                    PASSWORD
                  </Label>
                </div>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={handleChange}
                    className="h-[54px] bg-gray-50 border-2 border-gray-200 rounded-[14px] pl-12 pr-12 text-slate-800 font-medium tracking-wide placeholder:text-gray-300 focus:border-gray-300 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-16 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 text-base tracking-wide mt-2 border border-slate-700 flex items-center justify-center gap-2"
              >
                <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                {loading ? "Logging in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer Toggle */}
        <div className="flex flex-col items-center pt-4 mt-6">
          <div className="w-[60px] h-[1px] bg-gray-200 mb-4" />
          <p className="text-sm text-gray-500 mb-2 tracking-wide">
            Don't have an account?
          </p>
          <Button
            variant="link"
            onClick={() => navigate("/register")}
            className="p-0 h-auto font-bold text-slate-800 hover:text-slate-600 transition-colors text-[15px] tracking-wide hover:no-underline"
          >
            Sign Up
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Login;