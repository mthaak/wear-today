import * as BackgroundFetch from 'expo-background-fetch'
import * as TaskManager from 'expo-task-manager'

import Store from './Store'
import WeatherService from './WeatherService'
import { NotificationService, createContentForWearRecommendation } from './NotificationService'
import { getWearRecommendation, getTodayWeather } from './weatherrules'

const INTERVAL = 3600 // update interval in seconds
const TASK_NAME = 'UPDATE_NOTIFICATION'

export async function updateNotification(): void {

  const profile = await Store.retrieveProfile()

  if (!profile) {
    console.error('Could not retrieve profile from store')
    return
  }

  if (!profile.alert.enabled || !profile.alert.time) {
    NotificationService.cancelAllScheduledNotifications()
    return
  }

  if (!profile.home) {
    console.warn('Home location not available. Cannot update push notification')
    return
  }

  const weatherForecast = await WeatherService.getWeatherAsync(profile.home, profile.tempUnit)

  if (!weatherForecast) {
    console.error('Could not retrieve weather forecast')
    return
  }

  const wearRecommendation = getWearRecommendation(weatherForecast, profile)
  const todayWeather = getTodayWeather(weatherForecast)
  const content = createContentForWearRecommendation(wearRecommendation, todayWeather, profile)

  // Remove all previous scheduled notifications before scheduling new
  NotificationService.cancelAllScheduledNotifications()
  profile.alert.days.map((enabled, dayIdx) => {
    if (enabled) {
      // Conversion needed because weekdays are counted differently in my app
      // My app: Monday - Sunday: 0 - 6
      // Expo API object: Sunday - Saturday: 1 - 7
      const dayIdxMod = (dayIdx + 1) % 7 + 1
      NotificationService.scheduleNotificationWeekly(content, dayIdxMod, profile.alert.time)
    }
  })

  console.log('Alert updated')
}

function defineTask(taskName: string, func) {
  try {
    TaskManager.defineTask(taskName, () => {
      try {
        func()
        return BackgroundFetch.Result.NewData
      } catch (error) {
        return BackgroundFetch.Result.Failed
      }
    })
    console.log(`Task ${taskName} defined`)
  } catch (error) {
    console.error(`Task ${taskName} define failed: ${error}`)
  }
}

async function registerBackgroundTask(taskName: string, interval: int) {
  try {
    await BackgroundFetch.registerTaskAsync(taskName, {
      minimumInterval: interval, // in seconds
      stopOnTerminate: false,
      startOnBoot: true,
    })
    console.log(`Task ${taskName} registered`)
  } catch (error) {
    console.log(`Task ${taskName} register failed: ${error}`)
  }
}

async function unregisterBackgroundTask(taskName: string) {
  await BackgroundFetch.unregisterTaskAsync(taskName)
  return
}

async function checkBackgroundFetchAvailable(): void {
  const status = await BackgroundFetch.getStatusAsync()
  if (status == BackgroundFetch.Status.Available) {
    return true
  } else if (status == BackgroundFetch.Status.Restricted) {
    alert('Background fetch is restricted. This means that the notification feature will not be functional.')
    return false
  } else if (status == BackgroundFetch.Status.Denied) {
    alert('Background fetch is disabled. This means that the notification feature will not be functional.')
    return false
  }
}

let isSetUp = false
export async function setUpBackgroundTasks(): void {
  // To prevent multiple setups
  if (isSetUp) { return }
  isSetUp = true

  const backgroundFetchAvailable = await checkBackgroundFetchAvailable()
  if (!backgroundFetchAvailable) { return }

  const notificationsAllowed = await NotificationService.allowsNotifications()
  if (!notificationsAllowed) {
    alert('Notification permissions are not granted by user.')
    return
  }

  defineTask(TASK_NAME, updateNotification)
}

export async function startBackgroundTasks(): void {
  await registerBackgroundTask(TASK_NAME, INTERVAL)
}

export async function stopBackgroundTasks(): void {
  await unregisterBackgroundTask(TASK_NAME).catch(() => { }) // ignore errors
  await NotificationService.cancelAllScheduledNotifications()
}
