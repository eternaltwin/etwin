# typed: false
# frozen_string_literal: true

module Etwin
  module Auth # rubocop:disable Style/Documentation
    class << AuthContext
      extend T::Sig

      sig(:final) { returns(String) }
      def AuthContext.name
        'Etwin::Auth::AuthContext'
      end

      sig(:final) { params(json_str: String).returns(T.self_type) }
      def AuthContext.from_json(json_str)
        deserialize JSON.parse(json_str)
      end

      sig(:final) { params(raw: T.untyped).returns(T.self_type) }
      def AuthContext.deserialize(raw)
        type = AuthType.deserialize(raw['type'])
        case type
        when AuthType::Guest then GuestAuthContext.deserialize(raw)
        when AuthType::User then UserAuthContext.deserialize(raw)
        else T.absurd(type)
        end
      end
    end
  end
end
