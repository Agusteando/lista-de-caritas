export default defineNuxtConfig({
  compatibilityDate: '2025-08-01',
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],
  modules: [],
  app: {
    head: {
      title: 'lista-de-caritas app',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#f7f1e8' },
        { name: 'robots', content: 'noindex,nofollow' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }
      ]
    }
  },
  runtimeConfig: {
    attendanceMysql: {
      host: process.env.ATTENDANCE_MYSQL_HOST || process.env.MYSQL_HOST || '127.0.0.1',
      port: Number(process.env.ATTENDANCE_MYSQL_PORT || process.env.MYSQL_PORT || 3306),
      user: process.env.ATTENDANCE_MYSQL_USER || process.env.MYSQL_USER || 'attendance_user',
      password: process.env.ATTENDANCE_MYSQL_PASSWORD || process.env.MYSQL_PASSWORD || '',
      database: process.env.ATTENDANCE_MYSQL_DATABASE || process.env.MYSQL_DATABASE || 'attendance'
    },
    matriculaMysql: {
      host: process.env.MATRICULA_MYSQL_HOST || process.env.ATTENDANCE_MYSQL_HOST || process.env.MYSQL_HOST || '127.0.0.1',
      port: Number(process.env.MATRICULA_MYSQL_PORT || process.env.ATTENDANCE_MYSQL_PORT || process.env.MYSQL_PORT || 3306),
      user: process.env.MATRICULA_MYSQL_USER || process.env.ATTENDANCE_MYSQL_USER || process.env.MYSQL_USER || 'attendance_user',
      password: process.env.MATRICULA_MYSQL_PASSWORD || process.env.ATTENDANCE_MYSQL_PASSWORD || process.env.MYSQL_PASSWORD || '',
      database: process.env.MATRICULA_MYSQL_DATABASE || process.env.ATTENDANCE_MYSQL_DATABASE || process.env.MYSQL_DATABASE || 'attendance'
    },
    public: {
      appName: 'lista-de-caritas app',
      brandLine: 'Pase de lista inmediato'
    }
  },
  nitro: {
    preset: 'node-server',
    compressPublicAssets: true,
    routeRules: {
      '/api/**': {
        headers: {
          'cache-control': 'no-store'
        }
      },
      '/**': {
        headers: {
          'x-robots-tag': 'noindex,nofollow'
        }
      }
    }
  },
  typescript: {
    strict: true,
    typeCheck: false
  }
})
