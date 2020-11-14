# typed: strict
# frozen_string_literal: true

module Etwin
  module Hammerfest
    # A valid Hammerfest server
    class HammerfestServer < T::Enum
      extend T::Sig

      enums do
        HammerfestEs = new('hammerfest.es')
        HammerfestFr = new('hammerfest.fr')
        HfestNet = new('hfest.net')
      end

      sig { returns(String) }
      def to_s
        T.cast(serialize, String)
      end

      sig { returns(String) }
      def inspect
        "HammerfestServer(#{self})"
      end
    end
  end
end
