# typed: strict
# frozen_string_literal: true

module Etwin
  module Auth
    # Authentication scope enum
    class AuthScope < T::Enum
      extend T::Sig

      enums do
        Default = new('Default')
      end

      sig { returns(String) }
      def to_s
        T.cast(serialize, String)
      end

      sig { returns(String) }
      def inspect
        "AuthScope(#{self})"
      end
    end
  end
end
