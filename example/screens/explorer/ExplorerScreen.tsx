import React from 'react';
import { Alert } from 'react-native';
import { IconExplorer } from 'rn-iconify';
import Clipboard from '@react-native-clipboard/clipboard';

export default function ExplorerScreen() {
  const handleCopyCode = (code: string) => {
    Clipboard.setString(code);
    Alert.alert('Copied!', 'Code copied to clipboard');
  };

  return (
    <IconExplorer
      iconSets={['mdi', 'heroicons', 'lucide', 'ph', 'feather', 'tabler', 'fa6-solid', 'fa6-regular']}
      maxResults={1000}
      onIconSelect={(iconName) => {
        console.log('Selected icon:', iconName);
      }}
      onCopyCode={handleCopyCode}
    />
  );
}
