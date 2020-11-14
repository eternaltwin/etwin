# typed: strict
# frozen_string_literal: true

module Etwin
  module Auth
    # User authentication context
    class UserAuthContext
      extend T::Helpers
      extend T::Sig

      final!

      sig(:final) { returns(AuthScope) }
      attr_reader :scope

      sig(:final) { returns(Etwin::User::ShortUser) }
      attr_reader :user

      sig(:final) { returns(T::Boolean) }
      attr_reader :is_administrator

      sig(:final) { params(scope: AuthScope, user: Etwin::User::ShortUser, is_administrator: T::Boolean).void }
      def initialize(scope, user, is_administrator)
        @scope = T.let(scope, AuthScope)
        @user = T.let(user, Etwin::User::ShortUser)
        @is_administrator = T.let(is_administrator, T::Boolean)
        freeze
      end

      sig(:final) { params(other: BasicObject).returns(T::Boolean) }
      def ==(other)
        case other
        when UserAuthContext
          @scope == other.scope && @user == other.user && @is_administrator == other.is_administrator
        else
          false
        end
      end

      sig(:final) { returns(Integer) }
      def hash
        [@scope, @user, @is_administrator].hash
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
          'user' => @user.as_json,
          'is_administrator' => @is_administrator
        }
      end

      sig(:final) { returns(String) }
      def inspect
        "UserAuthContext(scope=#{@scope.inspect},user=#{@user.inspect},is_administrator=#{@is_administrator.inspect})"
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
          user = Etwin::User::ShortUser.deserialize(raw['user'])
          is_administrator = raw['is_administrator']
          new(scope, user, is_administrator)
        end
      end
    end
  end
end
