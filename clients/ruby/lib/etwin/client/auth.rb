# typed: strict
# frozen_string_literal: true

module Etwin
  module Client
    # Eternal-Twin client authentication data
    class Auth
      extend T::Helpers
      extend T::Sig

      final!

      sig(:final) { returns(T.nilable(String)) }
      attr_reader :authorization_header

      sig(:final) { params(authorization_header: T.nilable(String)).void }
      def initialize(authorization_header)
        @authorization_header = T.let(authorization_header, T.nilable(String))
        freeze
      end

      sig(:final) { params(other: BasicObject).returns(T::Boolean) }
      def ==(other)
        case other
        when Auth
          @authorization_header == other.authorization_header
        else
          false
        end
      end

      sig(:final) { returns(Integer) }
      def hash
        [@authorization_header].hash
      end

      sig(:final) { returns(String) }
      def inspect
        PP.singleline_pp(self, String.new)
      end

      sig(:final) { params(pp: T.untyped).returns(T.untyped) }
      def pretty_print(pp)
        pp.group(0, "#{self.class.name}(", ')') do
          pp.nest 1 do
            pp.breakable ''
            pp.text 'authorization_header='
            pp.pp @authorization_header
          end
          pp.breakable ''
        end
      end

      Guest = new(nil)

      class << self
        extend T::Sig

        sig(:final) { params(key: String).returns(T.attached_class) }
        def from_token(key)
          new("Bearer #{key}")
        end
      end
    end
  end
end
