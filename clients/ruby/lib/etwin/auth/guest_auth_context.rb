# typed: strict
# frozen_string_literal: true

module Etwin
  module Auth
    # Guest authentication context
    class GuestAuthContext
      extend T::Helpers
      extend T::Sig

      final!

      sig(:final) { returns(AuthScope) }
      attr_reader :scope

      sig(:final) { params(scope: AuthScope).void }
      def initialize(scope)
        @scope = T.let(scope, AuthScope)
        freeze
      end

      sig(:final) { params(other: BasicObject).returns(T::Boolean) }
      def ==(other)
        case other
        when GuestAuthContext
          @scope == other.scope
        else
          false
        end
      end

      sig(:final) { returns(Integer) }
      def hash
        [@scope].hash
      end

      # https://github.com/sorbet/sorbet/blob/master/rbi/stdlib/json.rbi#L194
      sig(:final) { params(opts: T.untyped).returns(String) }
      def to_json(opts = nil)
        JSON.generate(as_json, opts)
      end

      sig(:final) { returns(T::Hash[String, T.untyped]) }
      def as_json
        {
          'scope' => @scope.serialize
        }
      end

      sig(:final) { returns(String) }
      def inspect
        "GuestAuthContext(scope=#{@scope.inspect})"
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
          new(scope)
        end
      end
    end
  end
end
