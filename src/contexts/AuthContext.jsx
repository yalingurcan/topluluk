import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [friendIds, setFriendIds] = useState(new Set())
  const [closeFriendIds, setCloseFriendIds] = useState(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else setLoading(false)
    }).catch(() => setLoading(false))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else {
        setProfile(null)
        setFriendIds(new Set())
        setCloseFriendIds(new Set())
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
    setLoading(false)
    refreshFriendIds(userId)
  }

  async function refreshFriendIds(userId) {
    const id = userId || profile?.id
    if (!id) return
    const { data } = await supabase
      .from('friendships')
      .select('sender_id, receiver_id, close_by_sender, close_by_receiver')
      .eq('status', 'accepted')
      .or(`sender_id.eq.${id},receiver_id.eq.${id}`)

    const friends = new Set()
    const closeOfMe = new Set() // friends who marked ME as their close friend
    for (const f of data || []) {
      const otherId = f.sender_id === id ? f.receiver_id : f.sender_id
      friends.add(otherId)
      const theyMarkedMeClose = f.sender_id === id ? f.close_by_receiver : f.close_by_sender
      if (theyMarkedMeClose) closeOfMe.add(otherId)
    }
    setFriendIds(friends)
    setCloseFriendIds(closeOfMe)
  }

  // 'self' | 'admin' | 'close_friend' | 'friend' | 'public' — viewer's relationship to otherId
  function getRelationshipTier(otherId) {
    if (!otherId) return 'public'
    if (profile?.id === otherId) return 'self'
    if (profile?.is_admin === true) return 'admin'
    if (closeFriendIds.has(otherId)) return 'close_friend'
    if (friendIds.has(otherId)) return 'friend'
    return 'public'
  }

  // Whether the viewer can see `field` on `owner` (a profile object, or just an id for a coarse check).
  // Without the owner's `privacy` settings loaded, this safely falls back to the 'friends' default.
  function canSeeField(owner, field) {
    const ownerId = typeof owner === 'string' ? owner : owner?.id
    const tier = getRelationshipTier(ownerId)
    if (tier === 'self' || tier === 'admin') return true
    const required = (typeof owner === 'object' ? owner?.privacy?.[field] : null) || 'friends'
    if (required === 'public') return true
    if (required === 'friends') return tier === 'friend' || tier === 'close_friend'
    if (required === 'close_friends') return tier === 'close_friend'
    return false
  }

  // Whether the viewer is allowed to see another user's full name
  function canSeeFullProfile(owner) {
    return canSeeField(owner, 'full_name')
  }

  // Pick the right label for a {id, full_name, username, privacy?} profile based on visibility settings
  function displayName(otherProfile) {
    if (!otherProfile) return ''
    return canSeeField(otherProfile, 'full_name') ? otherProfile.full_name : `@${otherProfile.username}`
  }

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  async function signUp(email, password, fullName, username, city, occupation) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, username, city, occupation } }
    })
    return { error }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function refreshProfile() {
    if (session) await fetchProfile(session.user.id)
  }

  return (
    <AuthContext.Provider value={{
      session, profile, loading, signIn, signUp, signOut, refreshProfile,
      friendIds, closeFriendIds, refreshFriendIds,
      getRelationshipTier, canSeeField, canSeeFullProfile, displayName
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
