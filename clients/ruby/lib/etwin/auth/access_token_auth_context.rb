# typed: strict
# frozen_string_literal: true

module Etwin
  module Auth
    # Access token authentication context
    class AccessTokenAuthContext
      extend T::Helpers
      extend T::Sig

      final!

      sig(:final) { returns(AuthScope) }
      attr_reader :scope

      sig(:final) { returns(Etwin::Oauth::ShortOauthClient) }
      attr_reader :client

      sig(:final) { returns(Etwin::User::ShortUser) }
      attr_reader :user

      sig(:final) { params(scope: AuthScope, client: Etwin::Oauth::ShortOauthClient, user: Etwin::User::ShortUser).void }
      def initialize(scope, client, user)
        @scope = T.let(scope, AuthScope)
        @client = T.let(client, Etwin::Oauth::ShortOauthClient)
        @user = T.let(user, Etwin::User::ShortUser)
        freeze
      end

      sig(:final) { params(other: BasicObject).returns(T::Boolean) }
      def ==(other)
        case other
        when AccessTokenAuthContext
          @scope == other.scope && @client == other.client && @user == other.user
        else
          false
        end
      end

      sig(:final) { returns(Integer) }
      def hash
        [@scope, @client, @user].hash
      end

      # https://github.com/sorbet/sorbet/blob/master/rbi/stdlib/json.rbi#L194
      sig(:final) { params(opts: T.untyped).returns(String) }
      def to_json(opts = nil)
        JSON.generate(as_json, opts)
      end

      sig(:final) { returns(T::Hash[String, T.untyped]) }
      def as_json
        {
          'scope' => @scope.serialize,
          'client' => @client.as_json,
          'user' => @user.as_json
        }
      end

      sig(:final) { returns(String) }
      def inspect
        PP.singleline_pp(self, String.new)
      end

      sig(:final) { params(pp: T.untyped).returns(T.untyped) }
      def pretty_print(pp)  # rubocop:disable Metrics/MethodLength
      pp.group(0, "#{self.class.name}(", ')') do
        pp.nest 1 do
          pp.breakable ''
          pp.text 'scope='
          pp.pp @scope
          pp.text ','
          pp.breakable ''
          pp.text 'client='
          pp.pp @client
          pp.text ','
          pp.breakable ''
          pp.text 'user='
          pp.pp @user
        end
        pp.breakable ''
      end
      end

      class << self
        extend T::Sig

        sig(:final) { params(json_str: String).returns(T.attached_class) }
        def from_json(json_str)
          deserialize JSON.parse(json_str)
        end

        sig(:final) { params(raw: T.untyped).returns(T.attached_class) }
        def deserialize(raw)
          scope = AuthScope.deserialize(raw['scope'])
          client = Etwin::Oauth::ShortOauthClient.deserialize(raw['client'])
          user = Etwin::User::ShortUser.deserialize(raw['user'])
          new(scope, client, user)
        end
      end
    end
  end
end
