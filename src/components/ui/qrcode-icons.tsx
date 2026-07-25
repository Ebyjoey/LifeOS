import { Globe, Type, Mail, Phone, MessageSquare, Wifi, User, MapPin, Calendar } from 'lucide-react';

export function getQRCodeTypeIcon(type: string) {
  const icons: Record<string, React.ReactNode> = {
    url: <Globe className="h-5 w-5" />,
    text: <Type className="h-5 w-5" />,
    email: <Mail className="h-5 w-5" />,
    phone: <Phone className="h-5 w-5" />,
    sms: <MessageSquare className="h-5 w-5" />,
    wifi: <Wifi className="h-5 w-5" />,
    vcard: <User className="h-5 w-5" />,
    location: <MapPin className="h-5 w-5" />,
    event: <Calendar className="h-5 w-5" />,
  };
  return icons[type] || <Type className="h-5 w-5" />;
}

export const QRCodeTypeColors: Record<string, string> = {
  url: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  text: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  email: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  phone: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  sms: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  wifi: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  vcard: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  location: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  event: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
};