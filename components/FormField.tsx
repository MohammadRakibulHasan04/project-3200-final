import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const FormField = ({ title, value, handleChangeText, otherStyles, keyboardType, placeholder, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, otherStyles]}>
      <Text style={styles.label}>{title}</Text>
      
      <View style={[
          styles.inputContainer,
          isFocused ? styles.inputFocused : styles.inputDefault
      ]}>
        <TextInput
          style={styles.input}
          value={value}
          placeholder={placeholder}
          placeholderTextColor="#7b7b8b"
          onChangeText={handleChangeText}
          secureTextEntry={title === 'Password' && !showPassword}
          keyboardType={keyboardType}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {title === 'Password' && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
             <Ionicons name={!showPassword ? "eye" : "eye-off"} size={24} color="#CDCDE0" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        color: '#CDCDE0',
        marginBottom: 8,
        fontWeight: '500',
    },
    inputContainer: {
        width: '100%',
        height: 56,
        paddingHorizontal: 16,
        borderRadius: 16,
        borderWidth: 2,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E1E2D',
    },
    inputDefault: {
        borderColor: '#232533',
    },
    inputFocused: {
        borderColor: '#FF8E01',
    },
    input: {
        flex: 1,
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
    }
});

export default FormField;
