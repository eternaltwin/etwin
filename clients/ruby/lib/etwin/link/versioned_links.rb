# typed: strict
# frozen_string_literal: true

module Etwin
  module Link
    # Versioned Eternal-Twin links
    class VersionedLinks
      extend T::Helpers
      extend T::Sig

      final!

      sig(:final) { returns(VersionedHammerfestLink) }
      attr_reader :hammerfest_es

      sig(:final) { returns(VersionedHammerfestLink) }
      attr_reader :hammerfest_fr

      sig(:final) { returns(VersionedHammerfestLink) }
      attr_reader :hfest_net

      sig(:final) { returns(VersionedTwinoidLink) }
      attr_reader :twinoid

      sig(:final) do
        params(
          hammerfest_es: VersionedHammerfestLink,
          hammerfest_fr: VersionedHammerfestLink,
          hfest_net: VersionedHammerfestLink,
          twinoid: VersionedTwinoidLink
        ).void
      end
      def initialize(hammerfest_es, hammerfest_fr, hfest_net, twinoid)
        @hammerfest_es = T.let(hammerfest_es, VersionedHammerfestLink)
        @hammerfest_fr = T.let(hammerfest_fr, VersionedHammerfestLink)
        @hfest_net = T.let(hfest_net, VersionedHammerfestLink)
        @twinoid = T.let(twinoid, VersionedTwinoidLink)
        freeze
      end

      sig(:final) { params(other: BasicObject).returns(T::Boolean) }
      def ==(other)
        case other
        when VersionedLinks
          @hammerfest_es == other.hammerfest_es &&
            @hammerfest_fr == other.hammerfest_fr &&
            @hfest_net == other.hfest_net &&
            @twinoid == other.twinoid
        else
          false
        end
      end

      sig(:final) { returns(Integer) }
      def hash
        [@hammerfest_es, @hammerfest_fr, @hfest_net, @twinoid].hash
      end

      # https://github.com/sorbet/sorbet/blob/master/rbi/stdlib/json.rbi#L194
      sig(:final) { params(opts: T.untyped).returns(String) }
      def to_json(opts = nil)
        JSON.generate(as_json, opts)
      end

      sig(:final) { returns(T::Hash[String, T.untyped]) }
      def as_json
        {
          'hammerfest_es' => @hammerfest_es.as_json,
          'hammerfest_fr' => @hammerfest_fr.as_json,
          'hfest_net' => @hfest_net.as_json,
          'twinoid' => @twinoid.as_json
        }
      end

      sig(:final) { returns(String) }
      def inspect
        PP.singleline_pp(self, String.new)
      end

      sig(:final) { params(pp: T.untyped).returns(T.untyped) }
      def pretty_print(pp)  # rubocop:disable Metrics/AbcSize, Metrics/MethodLength
        pp.group(0, "#{self.class.name}(", ')') do
          pp.nest 1 do
            pp.breakable ''
            pp.text 'hammerfest_es='
            pp.pp @hammerfest_es
            pp.text ','
            pp.breakable ''
            pp.text 'hammerfest_fr='
            pp.pp @hammerfest_fr
            pp.text ','
            pp.breakable ''
            pp.text 'hfest_net='
            pp.pp @hfest_net
            pp.text ','
            pp.breakable ''
            pp.text 'twinoid='
            pp.pp @twinoid
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
          hammerfest_es = VersionedHammerfestLink.deserialize(raw['hammerfest_es'])
          hammerfest_fr = VersionedHammerfestLink.deserialize(raw['hammerfest_fr'])
          hfest_net = VersionedHammerfestLink.deserialize(raw['hfest_net'])
          twinoid = VersionedTwinoidLink.deserialize(raw['twinoid'])
          new(hammerfest_es, hammerfest_fr, hfest_net, twinoid)
        end
      end
    end
  end
end
