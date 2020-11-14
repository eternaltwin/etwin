# typed: strict
# frozen_string_literal: true

module Etwin
  module Auth
    # Authentication type enum
    class AuthType < T::Enum
      extend T::Sig

      enums do
        Guest = new('Guest')
        User = new('User')
      end

      sig { returns(String) }
      def to_s
        T.cast(serialize, String)
      end

      sig { returns(String) }
      def inspect
        "AuthType(#{self})"
      end
    end
  end
end
