import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/attenwell-logo.jpg";

const Register = () => {
  const navigate = useNavigate();
  const { register, loading } = useAuth();
  const [formData, setFormData] = useState({
    parentName: "",
    childName: "",
    age: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAgeChange = (value) => {
    setFormData({
      ...formData,
      age: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.parentName || !formData.childName || !formData.age || !formData.email || !formData.password) {
      toast.error("Please fill in all fields");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    const userData = {
      username: formData.email.split('@')[0], // Use email prefix as username
      email: formData.email,
      password: formData.password,
      password_confirm: formData.confirmPassword,
      parent_name: formData.parentName,
      child_name: formData.childName,
      child_age: parseInt(formData.age),
    };

    const result = await register(userData);
    
    if (result.success) {
      toast.success("Registration successful!");
      navigate("/home");
    } else {
      toast.error(result.error || "Registration failed");
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
            Create Account
          </h2>
          <p className="text-sm text-gray-500 tracking-wide">
            Start your wellness journey today
          </p>
        </div>

        {/* Form Section */}
        <Card className="border-0 shadow-none bg-transparent">
          <CardContent className="p-0">
            {/* Section Header */}
            <div className="flex items-center mb-5">
              <div className="flex-1 h-[1px] bg-gray-200" />
              <span className="text-[9px] font-bold text-gray-400 tracking-[1.5px] mx-3">
                REGISTRATION DETAILS
              </span>
              <div className="flex-1 h-[1px] bg-gray-200" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-[18px]">
              {/* Parent Name Input Group */}
              <div className="mb-1">
                <div className="flex items-center mb-2">
                  <div className="w-[5px] h-[5px] rounded-full bg-amber-600 mr-2" />
                  <Label 
                    htmlFor="parentName" 
                    className="text-[10px] font-bold text-gray-400 tracking-[1.2px]"
                  >
                    PARENT NAME
                  </Label>
                </div>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <Input
                    id="parentName"
                    name="parentName"
                    type="text"
                    placeholder="Enter parent's name"
                    value={formData.parentName}
                    onChange={handleChange}
                    className="h-[54px] bg-gray-50 border-2 border-gray-200 rounded-[14px] pl-12 pr-4 text-slate-800 font-medium tracking-wide placeholder:text-gray-300 focus:border-gray-300 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    required
                  />
                </div>
              </div>

              {/* Child Name Input Group */}
              <div className="mb-1">
                <div className="flex items-center mb-2">
                  <div className="w-[5px] h-[5px] rounded-full bg-amber-600 mr-2" />
                  <Label 
                    htmlFor="childName" 
                    className="text-[10px] font-bold text-gray-400 tracking-[1.2px]"
                  >
                    CHILD NAME
                  </Label>
                </div>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <Input
                    id="childName"
                    name="childName"
                    type="text"
                    placeholder="Enter child's name"
                    value={formData.childName}
                    onChange={handleChange}
                    className="h-[54px] bg-gray-50 border-2 border-gray-200 rounded-[14px] pl-12 pr-4 text-slate-800 font-medium tracking-wide placeholder:text-gray-300 focus:border-gray-300 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    required
                  />
                </div>
              </div>

              {/* Child Age Select Group */}
              <div className="mb-1">
                <div className="flex items-center mb-2">
                  <div className="w-[5px] h-[5px] rounded-full bg-amber-600 mr-2" />
                  <Label 
                    htmlFor="age" 
                    className="text-[10px] font-bold text-gray-400 tracking-[1.2px]"
                  >
                    CHILD'S AGE
                  </Label>
                </div>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <Select value={formData.age} onValueChange={handleAgeChange}>
                    <SelectTrigger className="h-[54px] bg-gray-50 border-2 border-gray-200 rounded-[14px] pl-12 pr-4 text-slate-800 font-medium tracking-wide focus:border-gray-300 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0">
                      <SelectValue placeholder="Select age" className="text-gray-300" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 13 }, (_, i) => i + 5).map((age) => (
                        <SelectItem key={age} value={age.toString()}>
                          {age} years old
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

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

              {/* Confirm Password Input Group */}
              <div className="mb-1">
                <div className="flex items-center mb-2">
                  <div className="w-[5px] h-[5px] rounded-full bg-amber-600 mr-2" />
                  <Label 
                    htmlFor="confirmPassword" 
                    className="text-[10px] font-bold text-gray-400 tracking-[1.2px]"
                  >
                    CONFIRM PASSWORD
                  </Label>
                </div>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="h-[54px] bg-gray-50 border-2 border-gray-200 rounded-[14px] pl-12 pr-12 text-slate-800 font-medium tracking-wide placeholder:text-gray-300 focus:border-gray-300 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  >
                    {showConfirmPassword ? (
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer Toggle */}
        <div className="flex flex-col items-center pt-4 mt-6">
          <div className="w-[60px] h-[1px] bg-gray-200 mb-4" />
          <p className="text-sm text-gray-500 mb-2 tracking-wide">
            Already have an account?
          </p>
          <Button
            variant="link"
            onClick={() => navigate("/login")}
            className="p-0 h-auto font-bold text-slate-800 hover:text-slate-600 transition-colors text-[15px] tracking-wide hover:no-underline"
          >
            Sign In
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Register;