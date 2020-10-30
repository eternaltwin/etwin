package net.eternaltwin.user

sealed class MaybeCompleteUser {
  data class Complete(val user: CompleteUser) : MaybeCompleteUser()

  data class Simple(val user: User) : MaybeCompleteUser()
}
