# typed: strict
# frozen_string_literal: true

module Etwin
  module Client
    # Etwin client interface
    module EtwinClient
      extend T::Helpers
      extend T::Sig

      interface!

      sig { abstract.params(auth: Auth, user_id: Etwin::User::UserId).returns(Etwin::User::User) }
      def get_user(auth, user_id); end
    end
  end
end
