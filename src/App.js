import React, { Component } from 'react';
import './App.css'
import SpotifyWebApi from 'spotify-web-api-js';
const spotifyApi = new SpotifyWebApi();

export default class App extends Component {
  constructor() {
    super();
    const params = this.getHashParams();
    const token = params.access_token;

    if (token) {
      spotifyApi.setAccessToken(token);
    }
    this.state = {
      loggedIn: token ? true : false,
      nowPlaying: { name: 'Not Checked', albumArt: '' },
      playlistID: '',
      playlistData: '',
      nameData: [],
      loaded: false,
      loading: false,
      toggle: false
    }
  }
  getHashParams() {
    var hashParams = {};
    var e, r = /([^&;=]+)=?([^&;]*)/g,
      q = window.location.hash.substring(1);
    e = r.exec(q)
    while (e) {
      hashParams[e[1]] = decodeURIComponent(e[2]);
      e = r.exec(q);
    }
    return hashParams;
  }

  getNowPlaying() {
    spotifyApi.getMyCurrentPlaybackState()
      .then((response) => {
        this.setState({
          nowPlaying: {
            name: response.item.name,
            albumArt: response.item.album.images[0].url
          }
        });
      })
  }

  getPlaylistData(counted, offset, playlistID) {
    this.setState({
      loading: true
    })
    spotifyApi.getPlaylistTracks(playlistID, { offset: offset })
      .then((res) => {
        let count = 0
        while (count < res.items.length) {
          this.setState({ loaded: false })
          let previousState = this.state.playlistData
          let append = previousState + res.items[count].track.name.toLowerCase() + " "
          this.setState({
            playlistData: append.replace(/[^a-zA-Z ]/g, "")
          })
          count++
        }
        counted += count
        let remaining = res.total - counted
        let offset = counted
        if (remaining > 0) {
          this.getPlaylistData(counted, offset, playlistID)
        }
        else {
          this.setState({ loaded: true, loading: false })
          this.visualizeData()
        }
      })
  }

  visualizeData() {
    var individualWordsPresent = this.state.playlistData.split(" ")
    individualWordsPresent.sort()
    let visualData = []

    var currentWord = null
    var count = 0

    for (var i = 0; i < individualWordsPresent.length; i++) {
      if (individualWordsPresent[i] !== currentWord) {
        let newEntry = { word: currentWord, count: count }
        visualData.push(newEntry)

        currentWord = individualWordsPresent[i]
        count = 1
      }
      else {
        count++
      }
    }

    function compare(a, b) {
      if (a.count < b.count) {
        return 1;
      }
      if (a.count > b.count) {
        return -1;
      }
      return 0;
    }

    visualData.sort(compare);

    this.setState({ nameData: visualData })
  }

  updatePlaylistID(e) {
    this.setState({ playlistID: [e.target.value] })
  }

  routeLogin() {
    window.location.href = 'http://localhost:8888/login';
  }

  render() {

    const login = (
      <div>
        <h4>First login into spotify with the button below.</h4>
        <p>This will allow the app to get the playist data. We will go over how to pick the playlist after you login.</p>
        <button className="btn-lg" style={{ backgroundColor: "#1DB954" }} onClick={this.routeLogin.bind(this)}>
          <a style={{ color: "black" }} href='http://localhost:8888/login' > Login to Spotify </a>
        </button>
      </div>
    )

    const table = (
      <div className="container">
      <h5>Here are the words and their counts in the titles of the songs you listen to.</h5>
        <table className="table table-sm">
          <thead>
            <tr>
              <th>Word</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>
            {this.state.nameData.map(word =>
              <>
                <tr key={word.word}>
                  <td>
                    {word.word}
                  </td>
                  <td>
                    {word.count}
                  </td>
                </tr>
              </>)}
          </tbody>
        </table>
        <br />
      </div>
    )

    const instructions = (
      <div>
        <p>Want to know what words appear the most in the track names of your favorite playlists?</p>
        <p> Please enter PlaylistID: <input type="text" onChange={this.updatePlaylistID.bind(this)}></input>
          <br />
          <button onClick={() => this.getPlaylistData(0, 0, this.state.playlistID)}>Get Playlist Track Data</button><br /></p>
        <h5>Don't know where to find the PlaylistID?</h5>
        <p>1. Go to <a href="https://open.spotify.com/">open.spotify.com</a> and log in if you aren't already.
        <br />2. Click on a playlist from the list of playlists, unfortunately Liked Songs playlist will not work.
        <br />3. You should see something similar to this image below. The PlaylistID is highlighted in the link. This will be different for each playlist.<br /> Just copy and paste it into the text field above.<br /><img className="imageHelper" src="/public/../guideforspotify.PNG" alt="guideImage" /><br />

        </p>

      </div>
    )

    const loggedIn = (
      <div>
        {this.state.loaded ? '' : instructions}
        {this.state.loading ? <span style={{ color: "red" }}>Loading...</span> : ''}
        {this.state.loaded ? table : ''}
      </div>
    )

    return (
      <div className="App" style={{ backgroundColor: "white", width: "75%" }}>
        <h1>Spotify Track Word Counter</h1>
        {this.state.loggedIn ? loggedIn : login}
      </div>
    );
  }
}
