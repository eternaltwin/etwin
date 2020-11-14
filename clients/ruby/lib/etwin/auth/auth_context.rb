# typed: strict
# frozen_string_literal: true

module Etwin
  module Auth # rubocop:disable Style/Documentation
    extend T::Sig
    AuthContext = T.type_alias { T.any(GuestAuthContext, UserAuthContext) }
  end
end
