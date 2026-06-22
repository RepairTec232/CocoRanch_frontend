import { environment } from "../environments/environment";
import { Notification, SearchOption, SidebarMenuItem } from "./app.interfaces";
const { DebugMode } = environment;

export const Notifications: Notification[] = [
    {
        text: 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit.',
        icon: 'pi pi-objects-column',
        title: 'Notificación 1',
        type: 'info',
        date: new Date()
      },
      {
        text: 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Lorem ipsum dolor sit amet, consectetuer adipiscing elit.',
        icon: 'pi pi-envelope',
        title: 'Notificación 2',
        type: 'success',
        date: new Date(Date.now() - 60000 * 5)
      },
      {
        text: 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Lorem ipsum dolor sit amet, consectetuer adipiscing elit.',
        icon: 'pi pi-sparkles',
        title: 'Notificación 3',
        type: 'error',
        date: new Date(Date.now() - 60000 * 10)
      }
]

export const SearchOptions: SearchOption[] = [
    { label: 'Iniciar Sesión', value: 'login' },
    { label: 'Contenido Protegido', value: 'protected' }
]
export const sidebarData: SidebarMenuItem[] = [
    {
      title: 'Dispositivos',
      icon: 'mobile',
      items: [
        {
          title: 'Android',
          icon: 'android',
          items: [
            {
              title: 'Samsung',
              items: [
                {
                  title: 'S23 Ultra',
                  to: '/android/samsung/s23-ultra',
                  items: [
                    { title: '512GB', to: '/android/samsung/s23-ultra/512gb' },
                    { title: '256GB', to: '/android/samsung/s22/256gb' },
                  ],
                },
                { title: 'S22', to: '/android/samsung/s22' },
              ],
            },
            {
              title: 'Xiaomi',
              items: [
                { title: 'Poco X3 pro', to: '/android/xiaomi/poco-x3-pro' },
                { title: 'Redmi Note 10', to: '/android/xiaomi/redmi-note-10' },
              ],
            },
            {
              title: 'Huawei',
              items: [
                { title: 'Y9 Prime', to: '/android/huawei/y9-prime' },
                { title: 'P40 Pro', to: '/android/huawei/p40-pro' },
              ],
            },
          ],
        },
        {
          title: 'iOS',
          items: [
            { title: 'iPhone 15', to: '/ios/iphone-15' },
            { title: 'iPhone 14', to: '/ios/iphone-14' },
            { title: 'iPhone 13', to: '/ios/iphone-13' },
          ],
        },
      ],
    },
    {
      title: 'Accesorios',
      icon: 'qrcode',
      items: [
        { title: 'Audífonos', to: '/accesorios/audifonos' },
        { title: 'Cargadores', to: '/accesorios/cargadores' },
        { title: 'Fundas', to: '/accesorios/fundas' },
      ],
    },
    {
      title: 'Soporte',
      icon: 'question-circle',
      items: [
        { title: 'FAQ', to: '/soporte/faq' },
        { title: 'Contacto', to: '/soporte/contacto' },
      ],
    },
];
export const Logger = {
    info: (eventName: string, log: any) => {
        DebugMode&&console.info(eventName, log);
    },
    warn: (eventName: string, log: any) => {
        DebugMode&&console.warn(eventName, log);
    },
    error: (eventName: string, error: any) => {
        DebugMode&&console.error(eventName, error);
    }
}