import React from 'react'
import { View, StyleSheet, FlatList } from 'react-native'
import { Text, ListItem, Button } from 'react-native-elements'
import Constants from 'expo-constants'

import * as Colors from '../constants/colors'
import Store from '../services/Store'
import { styles as gStyles } from '../constants/styles'

export default class SettingsScreen extends React.Component {
  constructor({ route, navigation }) {
    super()
    this.navigation = navigation
    this.state = { profile: null }

    // Dynamic placeholders need to be set only once at init
    Store.retrieveProfile().then(profile => {
      this.namePlaceholder = profile.name || 'Type your name'
      this.setState({ profile: profile })
    })
  }

  componentDidMount() {
    Store.subscribe(this.updateProfile)
  }

  componentWillUnmount() {
    Store.unsubscribe(this.updateProfile)
  }

  updateProfile = async () => {
    return await Store.retrieveProfile().then(this.setProfile)
  }

  setProfile = (profile: UserProfile) => {
    this.setState({
      profile: profile
    })
  }

  handleEdit(key, value) {
    const { profile } = this.state
    profile[key] = value

    this.setState({ profile })
    Store.saveProfile(profile)
  }

  resetSettings() {
    this.namePlaceholder = 'Type your name'
    Store.resetProfile()
  }

  render() {
    const { profile } = this.state
    if (profile == null) { return <Text>Loading...</Text> }

    return (
      <>
        <View style={styles.container}>
          <FlatList
            ListHeaderComponent={
              <>
                <View style={styles.list}>
                  <ListItem bottomDivider>
                    <ListItem.Content>
                      <ListItem.Title>Name</ListItem.Title>
                    </ListItem.Content>
                    <ListItem.Input
                      placeholder={this.namePlaceholder}
                      onChangeText={value => this.handleEdit('name', value)}
                    />
                  </ListItem>
                  <ListItem bottomDivider>
                    <ListItem.Content>
                      <ListItem.Title>Gender</ListItem.Title>
                    </ListItem.Content>
                    <ListItem.ButtonGroup
                      buttons={['Man', 'Woman']}
                      selectedIndex={profile.gender}
                      onPress={(index) => this.handleEdit('gender', index)}
                    />
                  </ListItem>
                  <ListItem bottomDivider>
                    <ListItem.Content>
                      <ListItem.Title>Home</ListItem.Title>
                    </ListItem.Content>
                    <Text style={[styles.grayText]}>{profile.home ? profile.home.toString() : 'Not set'}</Text>
                    <ListItem.Chevron
                      size={24}
                      onPress={(index) => this.navigation.navigate('Location')}
                    />
                  </ListItem>
                  <ListItem bottomDivider>
                    <ListItem.Content>
                      <ListItem.Title>Commute</ListItem.Title>
                    </ListItem.Content>
                    <ListItem.Chevron
                      size={24}
                      onPress={(index) => this.navigation.navigate('Commute')}
                    />
                  </ListItem>
                  <ListItem bottomDivider>
                    <ListItem.Content>
                      <ListItem.Title>Alert</ListItem.Title>
                    </ListItem.Content>
                    <ListItem.Chevron
                      size={24}
                      onPress={(index) => this.navigation.navigate('Alert')}
                    />
                  </ListItem>
                  <ListItem bottomDivider>
                    <ListItem.Content>
                      <ListItem.Title>Temperature unit</ListItem.Title>
                    </ListItem.Content>
                    <ListItem.ButtonGroup
                      buttons={['°C', '°F']}
                      selectedIndex={profile.tempUnit}
                      onPress={(index) => this.handleEdit('tempUnit', index)}
                    />
                  </ListItem>
                  <ListItem bottomDivider>
                    <Button
                      title='Reset to default settings'
                      onPress={() => this.resetSettings()}
                      containerStyle={[gStyles.center]}
                      titleStyle={[gStyles.normal]}
                      raised
                    />
                  </ListItem>
                </View>
              </>
            }
          />
          <Text style={[styles.footer]}>Build date: {Constants.manifest.extra.buildDate}</Text>
        </View>
      </>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background
  },
  list: {
    borderTopWidth: 1,
    borderColor: Colors.lightAccent
  },
  grayText: {
    color: Colors.darkerGray
  },
  footer: {
    textAlign: 'center',
    color: Colors.gray,
    marginBottom: 5
  }
})
