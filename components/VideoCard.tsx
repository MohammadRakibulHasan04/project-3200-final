import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';

const VideoCard = ({ video }) => {
  const { id, snippet } = video;
  const videoId = id.videoId;
  const [isPlaying, setIsPlaying] = useState(false);

  const handleThumbnailPress = () => {
    setIsPlaying(true);
  };

  const handlePlayerStateChange = (state) => {
    // State values: "unstarted", "ended", "playing", "paused", "buffering", "cued"
    if (state === 'ended') {
      setIsPlaying(false);
    }
  };

  return (
    <View style={styles.card}>
      {!isPlaying ? (
        // Thumbnail view with play button overlay
        <TouchableOpacity 
          activeOpacity={0.9}
          onPress={handleThumbnailPress}
          style={styles.thumbnailContainer}
        >
          <Image 
            source={{ uri: snippet.thumbnails.high.url }} 
            style={styles.thumbnail}
            resizeMode="cover"
          />
          <View style={styles.playOverlay}>
            <View style={styles.playButton}>
              <Ionicons name="play" size={32} color="white" />
            </View>
          </View>
        </TouchableOpacity>
      ) : (
        // YouTube Player view
        <View style={styles.playerContainer}>
          <YoutubePlayer
            height={220}
            videoId={videoId}
            play={isPlaying}
            onChangeState={handlePlayerStateChange}
          />
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setIsPlaying(false)}
          >
            <Ionicons name="close-circle" size={28} color="#FF8E01" />
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.infoContainer}>
        <View style={styles.avatar}>
           <Text style={styles.avatarText}>{snippet.channelTitle.charAt(0)}</Text>
        </View>
        
        <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={2}>
                {snippet.title}
            </Text>
            <Text style={styles.channel}>
                {snippet.channelTitle}
            </Text>
        </View>
        
        <TouchableOpacity>
             <Ionicons name="ellipsis-vertical" size={20} color="#CDCDE0" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
    card: {
        marginBottom: 24,
        backgroundColor: '#1E1E2D',
        borderRadius: 16,
        overflow: 'hidden',
    },
    thumbnailContainer: {
        position: 'relative',
    },
    thumbnail: {
        width: '100%',
        height: 200,
    },
    playOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    playButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FF8E01',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    playerContainer: {
        position: 'relative',
        width: '100%',
        height: 220,
        backgroundColor: '#000',
    },
    closeButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 14,
    },
    infoContainer: {
        flexDirection: 'row',
        padding: 12,
        alignItems: 'flex-start',
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#FF8E01',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#232533',
        marginRight: 10,
    },
    avatarText: {
        color: 'white',
        fontWeight: 'bold',
    },
    textContainer: {
        flex: 1,
        marginRight: 10,
    },
    title: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
        lineHeight: 20,
    },
    channel: {
        color: '#CDCDE0',
        fontSize: 12,
        marginTop: 4,
    }
});

export default VideoCard;
