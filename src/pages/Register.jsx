import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import logo from "@/assets/attenwell-logo.jpg";

const Register = () => {
  const navigate = useNavigate();
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

  const handleSubmit = (e) => {
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

    // In a real app, this would be an API call
    const userData = {
      parentName: formData.parentName,
      childName: formData.childName,
      age: parseInt(formData.age),
      email: formData.email,
    };
    
    localStorage.setItem("attenwell_user", JSON.stringify(userData));
    toast.success("Registration successful!");
    navigate("/home");
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
          <CardTitle className="text-2xl font-bold text-blue-600 mb-2">Join AttenWell</CardTitle>
          <CardDescription className="text-gray-600 text-base">
            Create your family account
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="parentName" className="text-gray-700 font-medium">Parent Name</Label>
              <Input
                id="parentName"
                name="parentName"
                type="text"
                placeholder="Enter your name"
                value={formData.parentName}
                onChange={handleChange}
                className="h-12 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20 rounded-lg"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="childName" className="text-gray-700 font-medium">Child Name</Label>
              <Input
                id="childName"
                name="childName"
                type="text"
                placeholder="Enter child's name"
                value={formData.childName}
                onChange={handleChange}
                className="h-12 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20 rounded-lg"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age" className="text-gray-700 font-medium">Child's Age</Label>
              <Select value={formData.age} onValueChange={handleAgeChange}>
                <SelectTrigger className="h-12 bg-white border-gray-200 text-gray-900 focus:border-blue-400 focus:ring-blue-400/20 rounded-lg">
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
              <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
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
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                className="h-12 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20 rounded-lg"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
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
              Create Account
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Button
                variant="link"
                onClick={() => navigate("/login")}
                className="p-0 h-auto font-medium text-blue-600 hover:text-blue-700 transition-colors"
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

