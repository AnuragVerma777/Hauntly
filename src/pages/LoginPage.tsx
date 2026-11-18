import React from 'react';
import { SpookyAuthScreen } from '../components/auth/SpookyAuthScreen';

export const LoginPage: React.FC = () => {
  return <SpookyAuthScreen initialMode="signin" />;
};
