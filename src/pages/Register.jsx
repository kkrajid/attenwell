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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 p-2 sm:p-4">
      <Card className="w-full max-w-md bg-white shadow-2xl border border-slate-200 rounded-3xl backdrop-blur-sm">
        <CardHeader className="text-center pb-4 sm:pb-6">
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full flex items-center justify-center border-2 border-amber-300 shadow-xl">
                <img src={logo} alt="AttenWell" className="w-12 h-12 sm:w-16 sm:h-16 rounded-full" />
              </div>
            </div>
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">Join AttenWell</CardTitle>
          <CardDescription className="text-slate-600 text-sm sm:text-base">
            Create your family account
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div className="space-y-2">
              <Label htmlFor="parentName" className="text-slate-700 font-medium text-sm sm:text-base">Parent Name</Label>
              <Input
                id="parentName"
                name="parentName"
                type="text"
                placeholder="Enter your name"
                value={formData.parentName}
                onChange={handleChange}
                className="h-10 sm:h-12 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:ring-amber-400/20 rounded-xl text-sm sm:text-base shadow-sm"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="childName" className="text-slate-700 font-medium text-sm sm:text-base">Child Name</Label>
              <Input
                id="childName"
                name="childName"
                type="text"
                placeholder="Enter child's name"
                value={formData.childName}
                onChange={handleChange}
                className="h-10 sm:h-12 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:ring-amber-400/20 rounded-xl text-sm sm:text-base shadow-sm"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age" className="text-slate-700 font-medium text-sm sm:text-base">Child's Age</Label>
              <Select value={formData.age} onValueChange={handleAgeChange}>
                <SelectTrigger className="h-10 sm:h-12 bg-white border-slate-200 text-slate-900 focus:border-amber-400 focus:ring-amber-400/20 rounded-xl text-sm sm:text-base shadow-sm">
                  <SelectValue placeholder="Select age" />
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
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-medium text-sm sm:text-base">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                className="h-10 sm:h-12 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:ring-amber-400/20 rounded-xl text-sm sm:text-base shadow-sm"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 font-medium text-sm sm:text-base">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                className="h-10 sm:h-12 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:ring-amber-400/20 rounded-xl text-sm sm:text-base shadow-sm"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-700 font-medium text-sm sm:text-base">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="h-10 sm:h-12 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:ring-amber-400/20 rounded-xl text-sm sm:text-base shadow-sm"
                required
              />
            </div>
            <Button 
              type="submit" 
              size="lg" 
              disabled={loading}
              className="w-full h-10 sm:h-12 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-sm sm:text-base"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
          <div className="mt-4 sm:mt-6 text-center">
            <p className="text-slate-600 text-sm sm:text-base">
              Already have an account?{" "}
              <Button
                variant="link"
                onClick={() => navigate("/login")}
                className="p-0 h-auto font-medium text-amber-600 hover:text-amber-700 transition-colors text-sm sm:text-base"
              >
                Sign in
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;

