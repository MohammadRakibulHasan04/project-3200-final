import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TouchableOpacity } from 'react-native';
import FormField from '../../components/FormField';
import { useGlobalContext } from '../../context/GlobalProvider';
import { getCurrentUser, signIn } from '../../lib/appwrite';

const SignIn = () => {
  const { setUser, setIsLogged } = useGlobalContext();
  const [form, setForm] = useState({
    email: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    if (!form.email || !form.password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsSubmitting(true);

    try {
      await signIn(form.email, form.password);
      const result = await getCurrentUser();
      setUser(result);
      setIsLogged(true);

      Alert.alert("Success", "User signed in successfully");
      if (result.onboarded) {
        router.replace('/home');
      } else {
        router.replace('/onboarding');
      }
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
            Log in to LearnTube
          </Text>

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
            placeholder="Enter your password"
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
                  {isSubmitting ? 'Signing In...' : 'Sign In'}
               </Text>
             </LinearGradient>
          </TouchableOpacity>

          <View style={{ justifyContent: 'center', paddingTop: 20, flexDirection: 'row', gap: 8 }}>
            <Text style={{ fontSize: 16, color: '#CDCDE0' }}>
              Don't have an account?
            </Text>
            <Link href="/sign-up" style={{ fontSize: 16, color: '#FF8E01', fontWeight: 'bold' }}>
              Sign Up
            </Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SignIn;
