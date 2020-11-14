# typed: strict
# frozen_string_literal: true

module Etwin
  module User
    # A valid Eternal-Twin user display name
    class UserDisplayName
      extend T::Helpers
      extend T::Sig

      final!

      protected

      sig(:final) { returns(String) }
      attr_reader :inner

      public

      sig(:final) { params(inner: String).void }
      def initialize(inner)
        @inner = T.let(inner.freeze, String)
        freeze
      end

      sig(:final) { params(other: BasicObject).returns(T::Boolean) }
      def ==(other)
        case other
        when UserDisplayName
          @inner == other.inner
        else
          false
        end
      end

      sig(:final) { returns(Integer) }
      def hash
        @inner.hash
      end

      sig(:final) { returns(String) }
      def to_s
        @inner
      end

      sig(:final) { returns(String) }
      def as_json
        @inner
      end

      sig(:final) { returns(String) }
      def inspect
        "UserDisplayName(#{@inner})"
      end
    end
  end
end
