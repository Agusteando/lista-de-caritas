declare global {
  const GRADE_ORDER: typeof import('../../server/utils/constants').GRADE_ORDER
  const H3Error: typeof import('../../node_modules/h3').H3Error
  const H3Event: typeof import('../../node_modules/h3').H3Event
  const PLANTELES: typeof import('../../server/utils/constants').PLANTELES
  const __buildAssetsURL: typeof import('../../node_modules/@nuxt/nitro-server/dist/runtime/utils/paths').buildAssetsURL
  const __publicAssetsURL: typeof import('../../node_modules/@nuxt/nitro-server/dist/runtime/utils/paths').publicAssetsURL
  const allowedPlantel: typeof import('../../server/utils/constants').allowedPlantel
  const appendCorsHeaders: typeof import('../../node_modules/h3').appendCorsHeaders
  const appendCorsPreflightHeaders: typeof import('../../node_modules/h3').appendCorsPreflightHeaders
  const appendHeader: typeof import('../../node_modules/h3').appendHeader
  const appendHeaders: typeof import('../../node_modules/h3').appendHeaders
  const appendResponseHeader: typeof import('../../node_modules/h3').appendResponseHeader
  const appendResponseHeaders: typeof import('../../node_modules/h3').appendResponseHeaders
  const assertLegacyPlantel: typeof import('../../server/utils/legacyRoster').assertLegacyPlantel
  const assertMethod: typeof import('../../node_modules/h3').assertMethod
  const assertStatus: typeof import('../../server/utils/validation').assertStatus
  const buildGroupMeta: typeof import('../../server/utils/legacyRoster').buildGroupMeta
  const buildPlantelMeta: typeof import('../../server/utils/legacyRoster').buildPlantelMeta
  const cachedEventHandler: typeof import('../../node_modules/nitropack/dist/runtime/internal/cache').cachedEventHandler
  const cachedFunction: typeof import('../../node_modules/nitropack/dist/runtime/internal/cache').cachedFunction
  const callNodeListener: typeof import('../../node_modules/h3').callNodeListener
  const clearResponseHeaders: typeof import('../../node_modules/h3').clearResponseHeaders
  const clearSession: typeof import('../../node_modules/h3').clearSession
  const createApp: typeof import('../../node_modules/h3').createApp
  const createAppEventHandler: typeof import('../../node_modules/h3').createAppEventHandler
  const createError: typeof import('../../node_modules/h3').createError
  const createEvent: typeof import('../../node_modules/h3').createEvent
  const createEventStream: typeof import('../../node_modules/h3').createEventStream
  const createRouter: typeof import('../../node_modules/h3').createRouter
  const defaultContentType: typeof import('../../node_modules/h3').defaultContentType
  const defineAppConfig: typeof import('../../node_modules/@nuxt/nitro-server/dist/runtime/utils/config').defineAppConfig
  const defineCachedEventHandler: typeof import('../../node_modules/nitropack/dist/runtime/internal/cache').defineCachedEventHandler
  const defineCachedFunction: typeof import('../../node_modules/nitropack/dist/runtime/internal/cache').defineCachedFunction
  const defineEventHandler: typeof import('../../node_modules/h3').defineEventHandler
  const defineLazyEventHandler: typeof import('../../node_modules/h3').defineLazyEventHandler
  const defineNitroErrorHandler: typeof import('../../node_modules/nitropack/dist/runtime/internal/error/utils').defineNitroErrorHandler
  const defineNitroPlugin: typeof import('../../node_modules/nitropack/dist/runtime/internal/plugin').defineNitroPlugin
  const defineNodeListener: typeof import('../../node_modules/h3').defineNodeListener
  const defineNodeMiddleware: typeof import('../../node_modules/h3').defineNodeMiddleware
  const defineRenderHandler: typeof import('../../node_modules/nitropack/dist/runtime/internal/renderer').defineRenderHandler
  const defineRequestMiddleware: typeof import('../../node_modules/h3').defineRequestMiddleware
  const defineResponseMiddleware: typeof import('../../node_modules/h3').defineResponseMiddleware
  const defineRouteMeta: typeof import('../../node_modules/nitropack/dist/runtime/internal/meta').defineRouteMeta
  const defineTask: typeof import('../../node_modules/nitropack/dist/runtime/internal/task').defineTask
  const defineWebSocket: typeof import('../../node_modules/h3').defineWebSocket
  const defineWebSocketHandler: typeof import('../../node_modules/h3').defineWebSocketHandler
  const deleteCookie: typeof import('../../node_modules/h3').deleteCookie
  const dynamicEventHandler: typeof import('../../node_modules/h3').dynamicEventHandler
  const ensureLogrosSchema: typeof import('../../server/utils/schema.ts').ensureLogrosSchema
  const eventHandler: typeof import('../../node_modules/h3').eventHandler
  const fetchWithEvent: typeof import('../../node_modules/h3').fetchWithEvent
  const fromNodeMiddleware: typeof import('../../node_modules/h3').fromNodeMiddleware
  const fromPlainHandler: typeof import('../../node_modules/h3').fromPlainHandler
  const fromWebHandler: typeof import('../../node_modules/h3').fromWebHandler
  const getCookie: typeof import('../../node_modules/h3').getCookie
  const getHeader: typeof import('../../node_modules/h3').getHeader
  const getHeaders: typeof import('../../node_modules/h3').getHeaders
  const getMethod: typeof import('../../node_modules/h3').getMethod
  const getProxyRequestHeaders: typeof import('../../node_modules/h3').getProxyRequestHeaders
  const getQuery: typeof import('../../node_modules/h3').getQuery
  const getRequestFingerprint: typeof import('../../node_modules/h3').getRequestFingerprint
  const getRequestHeader: typeof import('../../node_modules/h3').getRequestHeader
  const getRequestHeaders: typeof import('../../node_modules/h3').getRequestHeaders
  const getRequestHost: typeof import('../../node_modules/h3').getRequestHost
  const getRequestIP: typeof import('../../node_modules/h3').getRequestIP
  const getRequestPath: typeof import('../../node_modules/h3').getRequestPath
  const getRequestProtocol: typeof import('../../node_modules/h3').getRequestProtocol
  const getRequestURL: typeof import('../../node_modules/h3').getRequestURL
  const getRequestWebStream: typeof import('../../node_modules/h3').getRequestWebStream
  const getResponseHeader: typeof import('../../node_modules/h3').getResponseHeader
  const getResponseHeaders: typeof import('../../node_modules/h3').getResponseHeaders
  const getResponseStatus: typeof import('../../node_modules/h3').getResponseStatus
  const getResponseStatusText: typeof import('../../node_modules/h3').getResponseStatusText
  const getRouteRules: typeof import('../../node_modules/nitropack/dist/runtime/internal/route-rules').getRouteRules
  const getRouterParam: typeof import('../../node_modules/h3').getRouterParam
  const getRouterParams: typeof import('../../node_modules/h3').getRouterParams
  const getSession: typeof import('../../node_modules/h3').getSession
  const getValidatedQuery: typeof import('../../node_modules/h3').getValidatedQuery
  const getValidatedRouterParams: typeof import('../../node_modules/h3').getValidatedRouterParams
  const handleCacheHeaders: typeof import('../../node_modules/h3').handleCacheHeaders
  const handleCors: typeof import('../../node_modules/h3').handleCors
  const hashString: typeof import('../../server/utils/hash').hashString
  const isCorsOriginAllowed: typeof import('../../node_modules/h3').isCorsOriginAllowed
  const isError: typeof import('../../node_modules/h3').isError
  const isEvent: typeof import('../../node_modules/h3').isEvent
  const isEventHandler: typeof import('../../node_modules/h3').isEventHandler
  const isMethod: typeof import('../../node_modules/h3').isMethod
  const isPreflightRequest: typeof import('../../node_modules/h3').isPreflightRequest
  const isStream: typeof import('../../node_modules/h3').isStream
  const isWebResponse: typeof import('../../node_modules/h3').isWebResponse
  const lazyEventHandler: typeof import('../../node_modules/h3').lazyEventHandler
  const legacyFromStatus: typeof import('../../server/utils/validation').legacyFromStatus
  const loadLegacyPlantelStudents: typeof import('../../server/utils/legacyRoster').loadLegacyPlantelStudents
  const logTechnicalFailure: typeof import('../../server/utils/logger').logTechnicalFailure
  const nitroPlugin: typeof import('../../node_modules/nitropack/dist/runtime/internal/plugin').nitroPlugin
  const normalizeAttendanceDate: typeof import('../../server/utils/dates').normalizeAttendanceDate
  const normalizeGrade: typeof import('../../server/utils/constants').normalizeGrade
  const normalizeGroup: typeof import('../../server/utils/constants').normalizeGroup
  const normalizePlantel: typeof import('../../server/utils/constants').normalizePlantel
  const normalizeStudentName: typeof import('../../server/utils/attendanceSources').normalizeStudentName
  const parseCookies: typeof import('../../node_modules/h3').parseCookies
  const promisifyNodeListener: typeof import('../../node_modules/h3').promisifyNodeListener
  const proxyRequest: typeof import('../../node_modules/h3').proxyRequest
  const readBody: typeof import('../../node_modules/h3').readBody
  const readDailyAttendance: typeof import('../../server/utils/attendanceSources').readDailyAttendance
  const readFormData: typeof import('../../node_modules/h3').readFormData
  const readMultipartFormData: typeof import('../../node_modules/h3').readMultipartFormData
  const readPortableAttendanceRows: typeof import('../../server/utils/attendanceSources').readPortableAttendanceRows
  const readRawBody: typeof import('../../node_modules/h3').readRawBody
  const readRetardosForGroup: typeof import('../../server/utils/retardos').readRetardosForGroup
  const readValidatedBody: typeof import('../../node_modules/h3').readValidatedBody
  const removeResponseHeader: typeof import('../../node_modules/h3').removeResponseHeader
  const routeGroup: typeof import('../../server/utils/validation').routeGroup
  const routePlantel: typeof import('../../server/utils/validation').routePlantel
  const runTask: typeof import('../../node_modules/nitropack/dist/runtime/internal/task').runTask
  const sanitizeStatusCode: typeof import('../../node_modules/h3').sanitizeStatusCode
  const sanitizeStatusMessage: typeof import('../../node_modules/h3').sanitizeStatusMessage
  const sealSession: typeof import('../../node_modules/h3').sealSession
  const send: typeof import('../../node_modules/h3').send
  const sendError: typeof import('../../node_modules/h3').sendError
  const sendIterable: typeof import('../../node_modules/h3').sendIterable
  const sendNoContent: typeof import('../../node_modules/h3').sendNoContent
  const sendProxy: typeof import('../../node_modules/h3').sendProxy
  const sendRedirect: typeof import('../../node_modules/h3').sendRedirect
  const sendStream: typeof import('../../node_modules/h3').sendStream
  const sendWebResponse: typeof import('../../node_modules/h3').sendWebResponse
  const serveStatic: typeof import('../../node_modules/h3').serveStatic
  const setCookie: typeof import('../../node_modules/h3').setCookie
  const setHeader: typeof import('../../node_modules/h3').setHeader
  const setHeaders: typeof import('../../node_modules/h3').setHeaders
  const setResponseHeader: typeof import('../../node_modules/h3').setResponseHeader
  const setResponseHeaders: typeof import('../../node_modules/h3').setResponseHeaders
  const setResponseStatus: typeof import('../../node_modules/h3').setResponseStatus
  const splitCookiesString: typeof import('../../node_modules/h3').splitCookiesString
  const stableHash: typeof import('../../server/utils/hash').stableHash
  const statusFromLegacyFields: typeof import('../../server/utils/attendanceSources').statusFromLegacyFields
  const summarizeWeeklyAttendance: typeof import('../../server/utils/attendanceSources').summarizeWeeklyAttendance
  const tableExists: typeof import('../../server/utils/attendanceSources').tableExists
  const toEventHandler: typeof import('../../node_modules/h3').toEventHandler
  const toNodeListener: typeof import('../../node_modules/h3').toNodeListener
  const toPlainHandler: typeof import('../../node_modules/h3').toPlainHandler
  const toWebHandler: typeof import('../../node_modules/h3').toWebHandler
  const toWebRequest: typeof import('../../node_modules/h3').toWebRequest
  const unsealSession: typeof import('../../node_modules/h3').unsealSession
  const updateSession: typeof import('../../node_modules/h3').updateSession
  const useAppConfig: typeof import('../../node_modules/nitropack/dist/runtime/internal/config').useAppConfig
  const useAttendanceDbPool: typeof import('../../server/utils/db').useAttendanceDbPool
  const useBase: typeof import('../../node_modules/h3').useBase
  const useDbPool: typeof import('../../server/utils/db').useDbPool
  const useEvent: typeof import('../../node_modules/nitropack/dist/runtime/internal/context').useEvent
  const useMatriculaDbPool: typeof import('../../server/utils/db').useMatriculaDbPool
  const useNitroApp: typeof import('../../node_modules/nitropack/dist/runtime/internal/app').useNitroApp
  const useRuntimeConfig: typeof import('../../node_modules/nitropack/dist/runtime/internal/config').useRuntimeConfig
  const useSession: typeof import('../../node_modules/h3').useSession
  const useStorage: typeof import('../../node_modules/nitropack/dist/runtime/internal/storage').useStorage
  const weekBoundsForAttendanceDate: typeof import('../../server/utils/dates').weekBoundsForAttendanceDate
  const withLogrosTransaction: typeof import('../../server/utils/db').withLogrosTransaction
  const withTransaction: typeof import('../../server/utils/db').withTransaction
  const writeEarlyHints: typeof import('../../node_modules/h3').writeEarlyHints
}
// for type re-export
declare global {
  // @ts-ignore
  export type { EventHandler, EventHandlerRequest, EventHandlerResponse, EventHandlerObject, H3EventContext } from '../../node_modules/h3'
  import('../../node_modules/h3')
  // @ts-ignore
  export type { PortableAttendanceStatus, DailyAttendanceRecord, WeeklyAttendanceDaySummary } from '../../server/utils/attendanceSources'
  import('../../server/utils/attendanceSources')
  // @ts-ignore
  export type { LegacyStudent, LegacyGroupMeta } from '../../server/utils/legacyRoster'
  import('../../server/utils/legacyRoster')
  // @ts-ignore
  export type { RetardoRecord } from '../../server/utils/retardos'
  import('../../server/utils/retardos')
}
export { H3Event, H3Error, appendCorsHeaders, appendCorsPreflightHeaders, appendHeader, appendHeaders, appendResponseHeader, appendResponseHeaders, assertMethod, callNodeListener, clearResponseHeaders, clearSession, createApp, createAppEventHandler, createError, createEvent, createEventStream, createRouter, defaultContentType, defineEventHandler, defineLazyEventHandler, defineNodeListener, defineNodeMiddleware, defineRequestMiddleware, defineResponseMiddleware, defineWebSocket, defineWebSocketHandler, deleteCookie, dynamicEventHandler, eventHandler, fetchWithEvent, fromNodeMiddleware, fromPlainHandler, fromWebHandler, getCookie, getHeader, getHeaders, getMethod, getProxyRequestHeaders, getQuery, getRequestFingerprint, getRequestHeader, getRequestHeaders, getRequestHost, getRequestIP, getRequestPath, getRequestProtocol, getRequestURL, getRequestWebStream, getResponseHeader, getResponseHeaders, getResponseStatus, getResponseStatusText, getRouterParam, getRouterParams, getSession, getValidatedQuery, getValidatedRouterParams, handleCacheHeaders, handleCors, isCorsOriginAllowed, isError, isEvent, isEventHandler, isMethod, isPreflightRequest, isStream, isWebResponse, lazyEventHandler, parseCookies, promisifyNodeListener, proxyRequest, readBody, readFormData, readMultipartFormData, readRawBody, readValidatedBody, removeResponseHeader, sanitizeStatusCode, sanitizeStatusMessage, sealSession, send, sendError, sendIterable, sendNoContent, sendProxy, sendRedirect, sendStream, sendWebResponse, serveStatic, setCookie, setHeader, setHeaders, setResponseHeader, setResponseHeaders, setResponseStatus, splitCookiesString, toEventHandler, toNodeListener, toPlainHandler, toWebHandler, toWebRequest, unsealSession, updateSession, useBase, useSession, writeEarlyHints } from 'h3';
export { useNitroApp } from 'nitropack/runtime/internal/app';
export { useRuntimeConfig, useAppConfig } from 'nitropack/runtime/internal/config';
export { defineNitroPlugin, nitroPlugin } from 'nitropack/runtime/internal/plugin';
export { defineCachedFunction, defineCachedEventHandler, cachedFunction, cachedEventHandler } from 'nitropack/runtime/internal/cache';
export { useStorage } from 'nitropack/runtime/internal/storage';
export { defineRenderHandler } from 'nitropack/runtime/internal/renderer';
export { defineRouteMeta } from 'nitropack/runtime/internal/meta';
export { getRouteRules } from 'nitropack/runtime/internal/route-rules';
export { useEvent } from 'nitropack/runtime/internal/context';
export { defineTask, runTask } from 'nitropack/runtime/internal/task';
export { defineNitroErrorHandler } from 'nitropack/runtime/internal/error/utils';
export { buildAssetsURL as __buildAssetsURL, publicAssetsURL as __publicAssetsURL } from 'C:/Users/hp/asistencia-docente/node_modules/@nuxt/nitro-server/dist/runtime/utils/paths';
export { defineAppConfig } from 'C:/Users/hp/asistencia-docente/node_modules/@nuxt/nitro-server/dist/runtime/utils/config';
export { ensureLogrosSchema } from 'C:/Users/hp/asistencia-docente/server/utils/schema';
export { tableExists, normalizeStudentName, statusFromLegacyFields, readPortableAttendanceRows, readDailyAttendance, summarizeWeeklyAttendance } from 'C:/Users/hp/asistencia-docente/server/utils/attendanceSources';
export { PLANTELES, GRADE_ORDER, allowedPlantel, normalizePlantel, normalizeGrade, normalizeGroup } from 'C:/Users/hp/asistencia-docente/server/utils/constants';
export { normalizeAttendanceDate, weekBoundsForAttendanceDate } from 'C:/Users/hp/asistencia-docente/server/utils/dates';
export { useAttendanceDbPool, useMatriculaDbPool, useDbPool, withTransaction, withLogrosTransaction } from 'C:/Users/hp/asistencia-docente/server/utils/db';
export { stableHash, hashString } from 'C:/Users/hp/asistencia-docente/server/utils/hash';
export { assertLegacyPlantel, loadLegacyPlantelStudents, buildGroupMeta, buildPlantelMeta } from 'C:/Users/hp/asistencia-docente/server/utils/legacyRoster';
export { logTechnicalFailure } from 'C:/Users/hp/asistencia-docente/server/utils/logger';
export { readRetardosForGroup } from 'C:/Users/hp/asistencia-docente/server/utils/retardos';
export { routePlantel, routeGroup, assertStatus, legacyFromStatus } from 'C:/Users/hp/asistencia-docente/server/utils/validation';