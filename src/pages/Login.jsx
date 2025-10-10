import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import logo from "@/assets/attenwell-logo.jpg";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error("Please fill in all fields");
      return;
    }

    // Simple validation - in a real app, this would be an API call
    if (formData.email === "arun.parent@example.com" && formData.password === "password") {
      const userData = {
        parentName: "Arun M",
        childName: "Arjun M",
        age: 8,
        email: formData.email,
      };
      
      localStorage.setItem("attenwell_user", JSON.stringify(userData));
      toast.success("Login successful!");
      navigate("/home");
    } else {
      toast.error("Invalid credentials. Use arun.parent@example.com / password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100 p-4">
      <Card className="w-full max-w-md bg-white shadow-lg border border-gray-100 rounded-2xl">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center border-2 border-blue-200">
                <img src={logo} alt="AttenWell" className="w-16 h-16 rounded-full" />
              </div>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-blue-600 mb-2">Welcome Back!</CardTitle>
          <CardDescription className="text-gray-600 text-base">
            Sign in to continue your journey
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="parent@example.com"
                value={formData.email}
                onChange={handleChange}
                className="h-12 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20 rounded-lg"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                className="h-12 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20 rounded-lg"
                required
              />
            </div>
            <Button 
              type="submit" 
              size="lg" 
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
            >
              Login
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <Button
                variant="link"
                onClick={() => navigate("/register")}
                className="p-0 h-auto font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                Register
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
