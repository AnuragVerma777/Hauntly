import React from 'react';
import { SpookyAuthScreen } from '../components/auth/SpookyAuthScreen';

export const SignupPage: React.FC = () => {
  return <SpookyAuthScreen initialMode="signup" />;
};
