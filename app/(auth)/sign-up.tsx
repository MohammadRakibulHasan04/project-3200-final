import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import FormField from '../../components/FormField';
import { useGlobalContext } from '../../context/GlobalProvider';
import { createUser } from '../../lib/appwrite';

const SignUp = () => {
  const { setUser, setIsLogged } = useGlobalContext();
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    if (!form.username || !form.email || !form.password || !form.name) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createUser(form.email, form.password, form.username, form.name);
      setUser(result);
      setIsLogged(true);

      router.replace('/onboarding');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ backgroundColor: '#0f0f10', height: '100%' }}>
      <ScrollView contentContainerStyle={{ height: '100%' }}>
        <View style={{ width: '100%', justifyContent: 'center', minHeight: '85%', paddingHorizontal: 16, marginVertical: 24 }}>
          
          <Text style={{ fontSize: 24, color: 'white', fontWeight: 'bold', marginTop: 40, marginBottom: 20 }}>
            Sign Up to LearnTube
          </Text>

          <FormField
            title="Full Name"
            value={form.name}
            handleChangeText={(e) => setForm({ ...form, name: e })}
            otherStyles={{ marginTop: 28 }}
            placeholder="Enter your full name"
          />

          <FormField
            title="Username"
            value={form.username}
            handleChangeText={(e) => setForm({ ...form, username: e })}
            otherStyles={{ marginTop: 28 }}
            placeholder="Choose a unique username"
          />

          <FormField
            title="Email"
            value={form.email}
            handleChangeText={(e) => setForm({ ...form, email: e })}
            otherStyles={{ marginTop: 28 }}
            keyboardType="email-address"
            placeholder="Enter your email"
          />

          <FormField
            title="Password"
            value={form.password}
            handleChangeText={(e) => setForm({ ...form, password: e })}
            otherStyles={{ marginTop: 28 }}
            placeholder="Create a password"
          />

          <TouchableOpacity
            onPress={submit}
            activeOpacity={0.7}
            disabled={isSubmitting}
            style={{ width: '100%', marginTop: 30 }}
          >
             <LinearGradient
               colors={['#FF8E01', '#FF6001']}
               start={{ x: 0, y: 0 }}
               end={{ x: 1, y: 1 }}
               style={{
                 borderRadius: 12,
                 minHeight: 62,
                 justifyContent: 'center',
                 alignItems: 'center',
                 opacity: isSubmitting ? 0.7 : 1
               }}
             >
               <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>
                  {isSubmitting ? 'Creating Account...' : 'Sign Up'}
               </Text>
             </LinearGradient>
          </TouchableOpacity>


          <View style={{ justifyContent: 'center', paddingTop: 20, flexDirection: 'row', gap: 8 }}>
            <Text style={{ fontSize: 16, color: '#CDCDE0' }}>
              Already have an account?
            </Text>
            <Link href="/sign-in" style={{ fontSize: 16, color: '#FF8E01', fontWeight: 'bold' }}>
              Log In
            </Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SignUp;
