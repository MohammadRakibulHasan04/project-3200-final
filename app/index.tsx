import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MotiView } from 'moti';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalContext } from '../context/GlobalProvider';

export default function App() {
  const { loading, isLogged, user } = useGlobalContext();

  if (!loading && isLogged) {
    if (user && user.onboarded) return <Redirect href="/roadmap" />;
    return <Redirect href="/onboarding" />;
  }

  return (
    <SafeAreaView className="bg-primary h-full" style={{ flex: 1, backgroundColor: '#0f0f10' }}>
      <ScrollView contentContainerStyle={{ height: '100%' }}>
        <View style={{ width: '100%', justifyContent: 'center', alignItems: 'center', height: '100%', padding: 16 }}>
          
          <MotiView
            from={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 1000 }}
            style={{ marginBottom: 40, alignItems: 'center' }}
          >
            <Text style={{ fontSize: 40, fontWeight: 'bold', color: 'white', letterSpacing: 1 }}>
              Learn<Text style={{ color: '#FF8E01' }}>Tube</Text>
            </Text>
            <Text style={{ color: '#CDCDE0', fontSize: 16, marginTop: 10, textAlign: 'center' }}>
              Focus on learning. Remove the noise.
            </Text>
          </MotiView>

          <TouchableOpacity
            onPress={() => router.push('/sign-in')}
            activeOpacity={0.7}
            style={{ width: '100%', marginTop: 20 }}
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
              }}
            >
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>
                Get Started
              </Text>
            </LinearGradient>
          </TouchableOpacity>

        </View>
      </ScrollView>
      <StatusBar backgroundColor='#161622' style='light' />
    </SafeAreaView>
  );
}
